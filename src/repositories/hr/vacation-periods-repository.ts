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
  update(data: UpdateVacationPeriodSchema): Promise<VacationPeriod | null>;
  save(vacationPeriod: VacationPeriod): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
