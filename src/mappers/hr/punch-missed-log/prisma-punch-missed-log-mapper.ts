import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PunchMissedLog,
  type PunchMissedLogResolutionType,
} from '@/entities/hr/punch-missed-log';
import type { PunchMissedLog as PrismaPunchMissedLog } from '@prisma/generated/client.js';

/**
 * Converte a linha Prisma para a entity de domínio. Campos `null` do banco
 * viram `null` nas props (consistente com getters do entity que normalizam
 * undefined → null).
 *
 * A coluna `date` é `@db.Date` no Postgres (trunca para start-of-day UTC);
 * o Prisma devolve como `Date` já nesta forma.
 */
export function punchMissedLogPrismaToDomain(
  raw: PrismaPunchMissedLog,
): PunchMissedLog {
  return PunchMissedLog.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      employeeId: new UniqueEntityID(raw.employeeId),
      date: raw.date,
      shiftAssignmentId: raw.shiftAssignmentId
        ? new UniqueEntityID(raw.shiftAssignmentId)
        : null,
      expectedStartTime: raw.expectedStartTime ?? null,
      expectedEndTime: raw.expectedEndTime ?? null,
      generatedAt: raw.generatedAt,
      generatedByJobId: raw.generatedByJobId ?? null,
      resolvedAt: raw.resolvedAt ?? null,
      resolutionType: raw.resolutionType
        ? (raw.resolutionType as PunchMissedLogResolutionType)
        : null,
    },
    new UniqueEntityID(raw.id),
  );
}

/**
 * Converte a entity para o shape aceito por `prisma.punchMissedLog.create`.
 * Chamado pelo worker `detect-missed-punches` (Plan 07-05) e pelo repo
 * Prisma.
 */
export function punchMissedLogDomainToPrisma(log: PunchMissedLog) {
  return {
    id: log.id.toString(),
    tenantId: log.tenantId.toString(),
    employeeId: log.employeeId.toString(),
    date: log.date,
    shiftAssignmentId: log.shiftAssignmentId?.toString() ?? null,
    expectedStartTime: log.expectedStartTime ?? null,
    expectedEndTime: log.expectedEndTime ?? null,
    generatedAt: log.generatedAt,
    generatedByJobId: log.generatedByJobId ?? null,
    resolvedAt: log.resolvedAt ?? null,
    resolutionType: log.resolutionType ?? null,
  };
}
