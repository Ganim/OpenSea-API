import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTransaction } from '@/entities/sales/pos-transaction';
import type { PosTransaction as PrismaPosTransaction } from '@prisma/generated/client.js';

export function posTransactionPrismaToDomain(
  raw: PrismaPosTransaction,
): PosTransaction {
  return PosTransaction.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      sessionId: new UniqueEntityID(raw.sessionId),
      orderId: new UniqueEntityID(raw.orderId),
      transactionNumber: raw.transactionNumber,
      status: raw.status,
      subtotal: Number(raw.subtotal),
      discountTotal: Number(raw.discountTotal),
      taxTotal: Number(raw.taxTotal),
      grandTotal: Number(raw.grandTotal),
      changeAmount: Number(raw.changeAmount),
      customerId: raw.customerId
        ? new UniqueEntityID(raw.customerId)
        : undefined,
      customerName: raw.customerName ?? undefined,
      customerDocument: raw.customerDocument ?? undefined,
      overrideByUserId: raw.overrideByUserId
        ? new UniqueEntityID(raw.overrideByUserId)
        : undefined,
      overrideReason: raw.overrideReason ?? undefined,
      syncedAt: raw.syncedAt ?? undefined,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}
