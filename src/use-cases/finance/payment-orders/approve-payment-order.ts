import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  BankingProvider,
  PaymentReceipt,
} from '@/services/banking/banking-provider.interface';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  PaymentOrderRecord,
  PaymentOrdersRepository,
} from '@/repositories/finance/payment-orders-repository';

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
  ) {}

  async execute(
    request: ApprovePaymentOrderRequest,
  ): Promise<ApprovePaymentOrderResponse> {
    const { orderId, tenantId, approvedById } = request;

    // Find the payment order
    const order = await this.paymentOrdersRepository.findById(
      new UniqueEntityID(orderId),
      tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Payment order not found');
    }

    // Validate order is PENDING_APPROVAL
    if (order.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError(
        'Only orders with PENDING_APPROVAL status can be approved',
      );
    }

    // Segregation of duties: approver must be different from requester
    if (order.requestedById === approvedById) {
      throw new BadRequestError(
        'The approver cannot be the same person who requested the payment',
      );
    }

    // Update status to APPROVED then PROCESSING
    await this.paymentOrdersRepository.update({
      id: new UniqueEntityID(orderId),
      tenantId,
      status: 'APPROVED',
      approvedById,
      approvedAt: new Date(),
    });

    await this.paymentOrdersRepository.update({
      id: new UniqueEntityID(orderId),
      tenantId,
      status: 'PROCESSING',
    });

    // Execute the payment via the banking provider
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
        // TED or BOLETO
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
      // Payment execution failed — mark as FAILED
      const failedOrder = await this.paymentOrdersRepository.update({
        id: new UniqueEntityID(orderId),
        tenantId,
        status: 'FAILED',
        errorMessage:
          error instanceof Error ? error.message : 'Unknown payment error',
      });

      return { order: failedOrder! };
    }

    // Payment succeeded — mark as COMPLETED
    const completedOrder = await this.paymentOrdersRepository.update({
      id: new UniqueEntityID(orderId),
      tenantId,
      status: 'COMPLETED',
      externalId: receipt.externalId,
      receiptData: receipt.receiptData,
    });

    // Mark the finance entry as PAID
    await this.financeEntriesRepository.update({
      id: new UniqueEntityID(order.entryId),
      tenantId,
      status: 'PAID',
      actualAmount: order.amount,
      paymentDate: new Date(),
    });

    return { order: completedOrder! };
  }
}
