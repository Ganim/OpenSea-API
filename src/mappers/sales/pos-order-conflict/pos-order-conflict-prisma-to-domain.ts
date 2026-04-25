import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PosOrderConflict,
  type ConflictDetail,
} from '@/entities/sales/pos-order-conflict';
import { PosOrderConflictStatus } from '@/entities/sales/value-objects/pos-order-conflict-status';
import type { PosOrderConflict as PrismaPosOrderConflict } from '@prisma/generated/client.js';

export function posOrderConflictPrismaToDomain(
  raw: PrismaPosOrderConflict,
): PosOrderConflict {
  return PosOrderConflict.create(
    {
      tenantId: raw.tenantId,
      saleLocalUuid: raw.saleLocalUuid,
      orderId: raw.orderId ?? null,
      posTerminalId: raw.posTerminalId,
      posSessionId: raw.posSessionId ?? null,
      posOperatorEmployeeId: raw.posOperatorEmployeeId ?? null,
      status: PosOrderConflictStatus.create(raw.status),
      conflictDetails: raw.conflictDetails as unknown as ConflictDetail[],
      resolutionDetails:
        (raw.resolutionDetails as Record<string, unknown> | null) ?? null,
      resolvedByUserId: raw.resolvedByUserId ?? null,
      resolvedAt: raw.resolvedAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
