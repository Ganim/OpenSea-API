import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import type {
  BankingProvider,
  PaymentReceipt,
} from '@/services/banking/banking-provider.interface';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';
import type {
  PaymentOrderRecord,
  PaymentOrdersRepository,
} from '@/repositories/finance/payment-orders-repository';
import type { GeneratePaymentReceiptUseCase } from './generate-payment-receipt';

interface ApprovePaymentOrderRequest {
  orderId: string;
  tenantId: string;
  approvedById: string;
}

interface ApprovePaymentOrderResponse {
  order: PaymentOrderRecord;
}

export class ApprovePaymentOrderUseCase {
  constructor(
    private paymentOrdersRepository: PaymentOrdersRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private getBankingProvider: (
      bankAccountId: string,
      tenantId: string,
    ) => Promise<BankingProvider>,
    private generatePaymentReceipt?: GeneratePaymentReceiptUseCase,
    private transactionManager?: TransactionManager,
    private financeEntryPaymentsRepository?: FinanceEntryPaymentsRepository,
  ) {}

  async execute(
    request: ApprovePaymentOrderRequest,
  ): Promise<ApprovePaymentOrderResponse> {
    const { orderId, tenantId, approvedById } = request;

    const order = await this.paymentOrdersRepository.findById(
      new UniqueEntityID(orderId),
      tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Payment order not found');
    }

    if (order.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError(
        'Only orders with PENDING_APPROVAL status can be approved',
      );
    }

    if (order.requestedById === approvedById) {
      throw new BadRequestError(
        'The approver cannot be the same person who requested the payment',
      );
    }

    // Phase 1 (atomic): CAS PENDING_APPROVAL → APPROVED → PROCESSING.
    // If two approvers race, only one wins the first updateMany because of
    // the expectedStatus guard; the loser's update affects 0 rows and we
    // throw BadRequestError here.
    const runPhase1 = async (tx?: TransactionClient) => {
      const approved = await this.paymentOrdersRepository.update(
        {
          id: new UniqueEntityID(orderId),
          tenantId,
          expectedStatus: 'PENDING_APPROVAL',
          status: 'APPROVED',
          approvedById,
          approvedAt: new Date(),
        },
        tx,
      );

      if (!approved) {
        throw new BadRequestError(
          'Payment order is no longer pending approval',
        );
      }

      const processing = await this.paymentOrdersRepository.update(
        {
          id: new UniqueEntityID(orderId),
          tenantId,
          expectedStatus: 'APPROVED',
          status: 'PROCESSING',
        },
        tx,
      );

      if (!processing) {
        throw new BadRequestError(
          'Payment order state changed during approval',
        );
      }

      return processing;
    };

    if (this.transactionManager) {
      await this.transactionManager.run((tx) => runPhase1(tx));
    } else {
      await runPhase1();
    }

    // Phase 2: execute the payment via the banking provider.
    // This is OUTSIDE any transaction — bank API calls may take many seconds
    // and must not hold a DB lock. Providers are responsible for their own
    // idempotency (e.g., PIX end-to-end IDs).
    let receipt: PaymentReceipt;
    try {
      const provider = await this.getBankingProvider(
        order.bankAccountId,
        tenantId,
      );
      await provider.authenticate();

      if (order.method === 'PIX') {
        receipt = await provider.executePixPayment({
          amount: order.amount,
          recipientPixKey: (order.recipientData.pixKey as string) ?? '',
          recipientName: order.recipientData.recipientName as
            | string
            | undefined,
          recipientCpfCnpj: order.recipientData.recipientCpfCnpj as
            | string
            | undefined,
          description: order.recipientData.description as string | undefined,
        });
      } else {
        receipt = await provider.executePayment({
          method: order.method as 'TED' | 'BOLETO',
          amount: order.amount,
          recipientBankCode: order.recipientData.bankCode as string | undefined,
          recipientAgency: order.recipientData.agency as string | undefined,
          recipientAccount: order.recipientData.account as string | undefined,
          recipientName: order.recipientData.recipientName as
            | string
            | undefined,
          recipientCpfCnpj: order.recipientData.recipientCpfCnpj as
            | string
            | undefined,
          barcode: order.recipientData.barcode as string | undefined,
          dueDate: order.recipientData.dueDate as string | undefined,
        });
      }
    } catch (error) {
      const failedOrder = await this.paymentOrdersRepository.update({
        id: new UniqueEntityID(orderId),
        tenantId,
        status: 'FAILED',
        errorMessage:
          error instanceof Error ? error.message : 'Unknown payment error',
      });

      return { order: failedOrder! };
    }

    // Phase 3 (atomic): mark order COMPLETED and reconcile the entry status
    // based on the sum of existing payments — never overwrite actualAmount
    // with the raw order.amount, because the same entry may already have
    // partial payments or parallel orders whose sum must be respected.
    const runPhase3 = async (tx?: TransactionClient) => {
      const completedOrder = await this.paymentOrdersRepository.update(
        {
          id: new UniqueEntityID(orderId),
          tenantId,
          expectedStatus: 'PROCESSING',
          status: 'COMPLETED',
          externalId: receipt.externalId,
          receiptData: receipt.receiptData,
        },
        tx,
      );

      if (!completedOrder) {
        throw new BadRequestError(
          'Payment order was modified during settlement',
        );
      }

      const lockedEntry = tx
        ? await this.financeEntriesRepository.findByIdForUpdate(
            new UniqueEntityID(order.entryId),
            tenantId,
            tx,
          )
        : await this.financeEntriesRepository.findById(
            new UniqueEntityID(order.entryId),
            tenantId,
          );

      if (!lockedEntry) {
        // Entry gone — order stays COMPLETED, but we can't reconcile.
        return completedOrder;
      }

      // Sum existing payments (recorded via register-payment or prior orders).
      // We treat THIS order's amount as additive: callers must eventually
      // persist a FinanceEntryPayment record for the order (via a future
      // register-payment integration). For now we add order.amount to the
      // observed sum to derive the new actualAmount.
      const existingPaymentsSum = this.financeEntryPaymentsRepository
        ? await this.financeEntryPaymentsRepository.sumByEntryId(
            new UniqueEntityID(order.entryId),
            tx,
          )
        : (lockedEntry.actualAmount ?? 0);

      const newTotal = existingPaymentsSum + order.amount;
      const isFullyPaid = newTotal >= lockedEntry.totalDue;
      const fullyPaidStatus =
        lockedEntry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';

      await this.financeEntriesRepository.update(
        {
          id: new UniqueEntityID(order.entryId),
          tenantId,
          status: isFullyPaid ? fullyPaidStatus : 'PARTIALLY_PAID',
          actualAmount: newTotal,
          paymentDate: isFullyPaid ? new Date() : undefined,
        },
        tx,
      );

      return completedOrder;
    };

    const completedOrder = this.transactionManager
      ? await this.transactionManager.run((tx) => runPhase3(tx))
      : await runPhase3();

    if (this.generatePaymentReceipt) {
      try {
        const receiptResult = await this.generatePaymentReceipt.execute({
          tenantId,
          orderId,
        });
        await this.paymentOrdersRepository.update({
          id: new UniqueEntityID(orderId),
          tenantId,
          receiptFileId: receiptResult.receiptFileId,
        });
      } catch {
        // Receipt PDF failure must not abort the approval.
      }
    }

    return { order: completedOrder };
  }
}
