import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosSession } from '@/entities/sales/pos-session';
import type { PosSession as PrismaPosSession } from '@prisma/generated/client.js';

export function posSessionPrismaToDomain(raw: PrismaPosSession): PosSession {
  return PosSession.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      terminalId: new UniqueEntityID(raw.terminalId),
      operatorUserId: new UniqueEntityID(raw.operatorUserId),
      status: raw.status,
      openedAt: raw.openedAt,
      closedAt: raw.closedAt ?? undefined,
      openingBalance: Number(raw.openingBalance),
      closingBalance: raw.closingBalance
        ? Number(raw.closingBalance)
        : undefined,
      expectedBalance: raw.expectedBalance
        ? Number(raw.expectedBalance)
        : undefined,
      difference: raw.difference ? Number(raw.difference) : undefined,
      closingBreakdown: raw.closingBreakdown as
        | Record<string, unknown>
        | undefined,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}
