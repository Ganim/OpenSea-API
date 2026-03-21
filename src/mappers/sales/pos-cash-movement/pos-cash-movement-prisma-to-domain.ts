import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosCashMovement } from '@/entities/sales/pos-cash-movement';
import type { PosCashMovement as PrismaMovement } from '@prisma/generated/client.js';

export function posCashMovementPrismaToDomain(
  raw: PrismaMovement,
): PosCashMovement {
  return PosCashMovement.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      sessionId: new UniqueEntityID(raw.sessionId),
      type: raw.type,
      amount: Number(raw.amount),
      reason: raw.reason ?? undefined,
      performedByUserId: new UniqueEntityID(raw.performedByUserId),
      authorizedByUserId: raw.authorizedByUserId
        ? new UniqueEntityID(raw.authorizedByUserId)
        : undefined,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}
