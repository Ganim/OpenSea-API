import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchMissedLog } from '@/entities/hr/punch-missed-log';
import { prisma } from '@/lib/prisma';
import {
  punchMissedLogDomainToPrisma,
  punchMissedLogPrismaToDomain,
} from '@/mappers/hr/punch-missed-log/prisma-punch-missed-log-mapper';
import type { Prisma } from '@prisma/generated/client.js';

import type {
  FindManyMissedLogsFilters,
  PunchMissedLogRepository,
} from '../punch-missed-log-repository';

/**
 * Normaliza uma Date para start-of-day UTC — espelha a coluna `@db.Date`
 * do Postgres (que armazena só `YYYY-MM-DD`). Todas as escritas/queries
 * passam por aqui antes de bater no Prisma para garantir que o UNIQUE
 * `(tenantId, employeeId, date)` case independente do offset do caller.
 */
function startOfDayUTC(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/**
 * Implementação Prisma do PunchMissedLogRepository.
 *
 * Multi-tenant: toda query filtra por `tenantId` no `where`. Soft-delete não
 * se aplica (log é output do scheduler — quando o funcionário é removido, o
 * FK CASCADE do Postgres limpa; ver ADR implícito em 07-01 Task 2).
 *
 * `findManyByTenant` ordena `generatedAt` desc para mostrar o mais recente
 * primeiro no dashboard do gestor (Plan 07-07).
 */
export class PrismaPunchMissedLogRepository
  implements PunchMissedLogRepository
{
  async create(log: PunchMissedLog): Promise<void> {
    await prisma.punchMissedLog.create({
      data: punchMissedLogDomainToPrisma(log),
    });
  }

  async save(log: PunchMissedLog): Promise<void> {
    const data = punchMissedLogDomainToPrisma(log);
    await prisma.punchMissedLog.update({
      where: { id: log.id.toString() },
      data: {
        shiftAssignmentId: data.shiftAssignmentId,
        expectedStartTime: data.expectedStartTime,
        expectedEndTime: data.expectedEndTime,
        generatedByJobId: data.generatedByJobId,
        resolvedAt: data.resolvedAt,
        resolutionType: data.resolutionType,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchMissedLog | null> {
    const raw = await prisma.punchMissedLog.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return raw ? punchMissedLogPrismaToDomain(raw) : null;
  }

  async findUniqueByTenantEmployeeDate(
    tenantId: string,
    employeeId: string,
    date: Date,
  ): Promise<PunchMissedLog | null> {
    const raw = await prisma.punchMissedLog.findUnique({
      where: {
        tenantId_employeeId_date: {
          tenantId,
          employeeId,
          date: startOfDayUTC(date),
        },
      },
    });
    return raw ? punchMissedLogPrismaToDomain(raw) : null;
  }

  async findManyByTenant(
    tenantId: string,
    filters: FindManyMissedLogsFilters = {},
  ): Promise<{ items: PunchMissedLog[]; total: number }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const where: Prisma.PunchMissedLogWhereInput = {
      tenantId,
      ...(filters.dateStart || filters.dateEnd
        ? {
            date: {
              ...(filters.dateStart
                ? { gte: startOfDayUTC(filters.dateStart) }
                : {}),
              ...(filters.dateEnd
                ? { lte: startOfDayUTC(filters.dateEnd) }
                : {}),
            },
          }
        : {}),
      ...(filters.employeeIds && filters.employeeIds.length > 0
        ? { employeeId: { in: filters.employeeIds } }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.punchMissedLog.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.punchMissedLog.count({ where }),
    ]);

    return { items: rows.map(punchMissedLogPrismaToDomain), total };
  }
}
