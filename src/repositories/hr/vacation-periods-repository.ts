import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { VacationPeriod } from '@/entities/hr/vacation-period';

export interface CreateVacationPeriodSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  acquisitionStart: Date;
  acquisitionEnd: Date;
  concessionStart: Date;
  concessionEnd: Date;
  totalDays: number;
  usedDays?: number;
  soldDays?: number;
  remainingDays?: number;
  status?: string;
  notes?: string;
}

export interface UpdateVacationPeriodSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  acquisitionStart?: Date;
  acquisitionEnd?: Date;
  concessionStart?: Date;
  concessionEnd?: Date;
  totalDays?: number;
  usedDays?: number;
  soldDays?: number;
  remainingDays?: number;
  status?: string;
  scheduledStart?: Date | null;
  scheduledEnd?: Date | null;
  notes?: string;
}

export interface FindVacationPeriodFilters {
  employeeId?: UniqueEntityID;
  status?: string;
  year?: number;
}

export interface VacationPeriodsRepository {
  create(data: CreateVacationPeriodSchema): Promise<VacationPeriod>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod | null>;
  findMany(
    tenantId: string,
    filters?: FindVacationPeriodFilters,
  ): Promise<VacationPeriod[]>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod[]>;
  findManyByEmployeeAndStatus(
    employeeId: UniqueEntityID,
    status: string,
    tenantId: string,
  ): Promise<VacationPeriod[]>;
  findManyByStatus(status: string, tenantId: string): Promise<VacationPeriod[]>;
  findAvailableByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod[]>;
  findCurrentByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<VacationPeriod | null>;
  findExpiring(beforeDate: Date, tenantId: string): Promise<VacationPeriod[]>;
  findExpiredPeriods(tenantId: string): Promise<VacationPeriod[]>;
  /**
   * Phase 07 / Plan 07-05a — retorna o período de férias que cobre `date`,
   * i.e. status em ('SCHEDULED' | 'IN_PROGRESS') e
   * `scheduledStart <= date <= scheduledEnd`. Consumido pelo
   * `DetectMissedPunchesUseCase` para skipar funcionários em férias ativas.
   *
   * Nome alinhado ao plan 07-05a (referenciado como "vacations repo"). Nosso
   * modelo canônico é `VacationPeriod` (não há um model `Vacation` separado —
   * a aquisição/concessão/agendamento convivem na mesma entity).
   */
  findApprovedCoveringDate(
    employeeId: string,
    tenantId: string,
    date: Date,
  ): Promise<VacationPeriod | null>;
  update(data: UpdateVacationPeriodSchema): Promise<VacationPeriod | null>;
  save(vacationPeriod: VacationPeriod): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
