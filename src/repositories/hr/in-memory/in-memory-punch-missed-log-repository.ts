import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchMissedLog } from '@/entities/hr/punch-missed-log';

import type {
  FindManyMissedLogsFilters,
  PunchMissedLogRepository,
} from '../punch-missed-log-repository';

/**
 * Normaliza uma Date para start-of-day UTC — espelha o que a coluna
 * `@db.Date` faz no Postgres (trunca para o dia em UTC). Necessário para
 * que `findUniqueByTenantEmployeeDate` continue casando após roundtrip de
 * timezones (ex.: `new Date('2026-04-22T03:00:00Z')` no BRT é dia 22 UTC).
 */
function toUtcStartOfDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * In-memory implementation usada por specs unitários. Espelha a semântica
 * do `PrismaPunchMissedLogRepository`:
 * - `tenantId` filtra todas as queries;
 * - `date` é comparada via start-of-day UTC (match do UNIQUE da tabela);
 * - `findManyByTenant` ordena desc por generatedAt e pagina por page/pageSize.
 */
export class InMemoryPunchMissedLogRepository
  implements PunchMissedLogRepository
{
  public items: PunchMissedLog[] = [];

  async create(log: PunchMissedLog): Promise<void> {
    this.items.push(log);
  }

  async save(log: PunchMissedLog): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === log.id.toString(),
    );
    if (index >= 0) {
      this.items[index] = log;
    }
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchMissedLog | null> {
    return (
      this.items.find(
        (log) =>
          log.id.toString() === id.toString() &&
          log.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findUniqueByTenantEmployeeDate(
    tenantId: string,
    employeeId: string,
    date: Date,
  ): Promise<PunchMissedLog | null> {
    const target = toUtcStartOfDay(date);
    return (
      this.items.find(
        (log) =>
          log.tenantId.toString() === tenantId &&
          log.employeeId.toString() === employeeId &&
          toUtcStartOfDay(log.date) === target,
      ) ?? null
    );
  }

  async findManyByTenant(
    tenantId: string,
    filters: FindManyMissedLogsFilters = {},
  ): Promise<{ items: PunchMissedLog[]; total: number }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const filtered = this.items.filter((log) => {
      if (log.tenantId.toString() !== tenantId) return false;

      if (filters.dateStart) {
        if (toUtcStartOfDay(log.date) < toUtcStartOfDay(filters.dateStart)) {
          return false;
        }
      }
      if (filters.dateEnd) {
        if (toUtcStartOfDay(log.date) > toUtcStartOfDay(filters.dateEnd)) {
          return false;
        }
      }
      if (filters.employeeIds && filters.employeeIds.length > 0) {
        if (!filters.employeeIds.includes(log.employeeId.toString())) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...filtered].sort(
      (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime(),
    );

    const start = (page - 1) * pageSize;
    const paginated = sorted.slice(start, start + pageSize);

    return { items: paginated, total: filtered.length };
  }
}
