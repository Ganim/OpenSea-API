import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PunchApproval,
  type PunchApprovalReason,
  type PunchApprovalStatus,
} from '@/entities/hr/punch-approval';
import type { PunchApproval as PrismaPunchApproval } from '@prisma/generated/client.js';

/**
 * Converte a linha Prisma para a entity de domínio. Campos `null` do banco
 * viram `undefined` em `Optional<...>` (pattern consistente com o mapper
 * de PunchDevice).
 */
export function punchApprovalPrismaToDomain(
  raw: PrismaPunchApproval,
): PunchApproval {
  return PunchApproval.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      timeEntryId: new UniqueEntityID(raw.timeEntryId),
      employeeId: new UniqueEntityID(raw.employeeId),
      reason: raw.reason as PunchApprovalReason,
      details: (raw.details as Record<string, unknown> | null) ?? undefined,
      status: raw.status as PunchApprovalStatus,
      resolverUserId: raw.resolverUserId
        ? new UniqueEntityID(raw.resolverUserId)
        : undefined,
      resolvedAt: raw.resolvedAt ?? undefined,
      resolverNote: raw.resolverNote ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
