import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import type { PosTerminalOperator as PrismaPosTerminalOperator } from '@prisma/generated/client.js';

export function posTerminalOperatorPrismaToDomain(
  raw: PrismaPosTerminalOperator,
): PosTerminalOperator {
  return PosTerminalOperator.create(
    {
      terminalId: new UniqueEntityID(raw.terminalId),
      employeeId: new UniqueEntityID(raw.employeeId),
      tenantId: raw.tenantId,
      isActive: raw.isActive,
      assignedAt: raw.assignedAt,
      assignedByUserId: new UniqueEntityID(raw.assignedByUserId),
      revokedAt: raw.revokedAt ?? null,
      revokedByUserId: raw.revokedByUserId
        ? new UniqueEntityID(raw.revokedByUserId)
        : null,
    },
    new UniqueEntityID(raw.id),
  );
}
