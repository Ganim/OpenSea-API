import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StoreCredit } from '@/entities/sales/store-credit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function storeCreditPrismaToDomain(raw: any): StoreCredit {
  return StoreCredit.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      customerId: new UniqueEntityID(raw.customerId),
      amount: Number(raw.amount),
      balance: Number(raw.balance),
      source: raw.source,
      sourceId: raw.sourceId ?? undefined,
      reservedForOrderId: raw.reservedForOrderId
        ? new UniqueEntityID(raw.reservedForOrderId)
        : undefined,
      expiresAt: raw.expiresAt ?? undefined,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
