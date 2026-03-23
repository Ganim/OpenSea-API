import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTransaction } from '@/entities/sales/pos-transaction';
import {
  PosTransactionPayment,
  type PosPaymentMethod,
  type PosPaymentLinkStatus,
} from '@/entities/sales/pos-transaction-payment';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';
import type { PosTransactionPaymentsRepository } from '@/repositories/sales/pos-transaction-payments-repository';
import type { PosTransactionsRepository } from '@/repositories/sales/pos-transactions-repository';

interface PaymentInput {
  method: PosPaymentMethod;
  amount: number;
  receivedAmount?: number;
  changeAmount?: number;
  installments?: number;
  authCode?: string;
  nsu?: string;
  pixTxId?: string;
  paymentLinkUrl?: string;
  paymentLinkStatus?: PosPaymentLinkStatus;
  tefTransactionId?: string;
  notes?: string;
}

interface CreatePosTransactionUseCaseRequest {
  tenantId: string;
  sessionId: string;
  orderId: string;
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  grandTotal: number;
  changeAmount?: number;
  customerId?: string;
  customerName?: string;
  customerDocument?: string;
  overrideByUserId?: string;
  overrideReason?: string;
  payments: PaymentInput[];
}

interface CreatePosTransactionUseCaseResponse {
  transaction: PosTransaction;
  payments: PosTransactionPayment[];
}

export class CreatePosTransactionUseCase {
  constructor(
    private posTransactionsRepository: PosTransactionsRepository,
    private posTransactionPaymentsRepository: PosTransactionPaymentsRepository,
    private posSessionsRepository: PosSessionsRepository,
  ) {}

  async execute(
    request: CreatePosTransactionUseCaseRequest,
  ): Promise<CreatePosTransactionUseCaseResponse> {
    const session = await this.posSessionsRepository.findById(
      new UniqueEntityID(request.sessionId),
      request.tenantId,
    );

    if (!session) {
      throw new ResourceNotFoundError('Session not found.');
    }

    if (session.status !== 'OPEN') {
      throw new BadRequestError(
        'Session is not open. Cannot create transaction.',
      );
    }

    // Validate payments cover the grand total
    const totalPaid = request.payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < request.grandTotal) {
      throw new BadRequestError(
        `Payment total (${totalPaid}) is less than grand total (${request.grandTotal}).`,
      );
    }

    const transactionNumber =
      await this.posTransactionsRepository.getNextTransactionNumber(
        request.sessionId,
      );

    const transaction = PosTransaction.create({
      tenantId: new UniqueEntityID(request.tenantId),
      sessionId: new UniqueEntityID(request.sessionId),
      orderId: new UniqueEntityID(request.orderId),
      transactionNumber,
      subtotal: request.subtotal,
      discountTotal: request.discountTotal,
      taxTotal: request.taxTotal,
      grandTotal: request.grandTotal,
      changeAmount: request.changeAmount,
      customerId: request.customerId
        ? new UniqueEntityID(request.customerId)
        : undefined,
      customerName: request.customerName,
      customerDocument: request.customerDocument,
      overrideByUserId: request.overrideByUserId
        ? new UniqueEntityID(request.overrideByUserId)
        : undefined,
      overrideReason: request.overrideReason,
    });

    await this.posTransactionsRepository.create(transaction);

    const payments = request.payments.map((p) =>
      PosTransactionPayment.create({
        tenantId: new UniqueEntityID(request.tenantId),
        transactionId: transaction.id,
        method: p.method,
        amount: p.amount,
        receivedAmount: p.receivedAmount,
        changeAmount: p.changeAmount,
        installments: p.installments,
        authCode: p.authCode,
        nsu: p.nsu,
        pixTxId: p.pixTxId,
        paymentLinkUrl: p.paymentLinkUrl,
        paymentLinkStatus: p.paymentLinkStatus,
        tefTransactionId: p.tefTransactionId,
        notes: p.notes,
      }),
    );

    await this.posTransactionPaymentsRepository.createMany(payments);

    return { transaction, payments };
  }
}
