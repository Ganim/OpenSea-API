import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchMissedLog } from '@/entities/hr/punch-missed-log';

/**
 * Filtros opcionais para listagem paginada de PunchMissedLog.
 *
 * Defaults aplicados pela implementação quando não fornecidos:
 * - `page = 1`
 * - `pageSize = 20` (máximo 100, enforçado pelo schema Zod no controller).
 *
 * `dateStart`/`dateEnd` são comparados contra a coluna DATE (UTC start-of-day)
 * — filtros são inclusive em ambas as pontas.
 */
export interface FindManyMissedLogsFilters {
  dateStart?: Date;
  dateEnd?: Date;
  employeeIds?: string[];
  page?: number;
  pageSize?: number;
}

/**
 * Contrato para persistência de PunchMissedLog (Phase 7 / Plan 07-01, D-12).
 *
 * - `create`: usado pelo scheduler `detect-missed-punches` (Plan 07-05);
 *   UNIQUE (tenantId, employeeId, date) protege contra dup no banco.
 * - `save`: usado quando Phase 9 ativa a feature de recuperação (markResolved).
 *   Em Phase 7 permanece sem call site, mas declarado aqui por simetria com
 *   outros repos HR (pattern Phase 04-03).
 * - `findUniqueByTenantEmployeeDate`: consulta idempotente antes do insert;
 *   também usada pelo controller de listing para checar se já existe log.
 * - `findManyByTenant`: listagem paginada usada pelo dashboard do gestor
 *   (Plan 07-03/07-07). Aceita filtro por funcionário (array — gestor pode
 *   ver múltiplos subordinados) e faixa de datas.
 */
export interface PunchMissedLogRepository {
  create(log: PunchMissedLog): Promise<void>;
  save(log: PunchMissedLog): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchMissedLog | null>;
  findUniqueByTenantEmployeeDate(
    tenantId: string,
    employeeId: string,
    date: Date,
  ): Promise<PunchMissedLog | null>;
  findManyByTenant(
    tenantId: string,
    filters?: FindManyMissedLogsFilters,
  ): Promise<{ items: PunchMissedLog[]; total: number }>;
}
