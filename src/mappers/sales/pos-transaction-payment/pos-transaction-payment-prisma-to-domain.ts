import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTransactionPayment } from '@/entities/sales/pos-transaction-payment';
import type { PosTransactionPayment as PrismaPayment } from '@prisma/generated/client.js';

export function posTransactionPaymentPrismaToDomain(
  raw: PrismaPayment,
): PosTransactionPayment {
  return PosTransactionPayment.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      transactionId: new UniqueEntityID(raw.transactionId),
      method: raw.method,
      amount: Number(raw.amount),
      receivedAmount: raw.receivedAmount ? Number(raw.receivedAmount) : undefined,
      changeAmount: raw.changeAmount ? Number(raw.changeAmount) : undefined,
      installments: raw.installments,
      authCode: raw.authCode ?? undefined,
      nsu: raw.nsu ?? undefined,
      pixTxId: raw.pixTxId ?? undefined,
      paymentLinkUrl: raw.paymentLinkUrl ?? undefined,
      paymentLinkStatus: raw.paymentLinkStatus ?? undefined,
      tefTransactionId: raw.tefTransactionId ?? undefined,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}
