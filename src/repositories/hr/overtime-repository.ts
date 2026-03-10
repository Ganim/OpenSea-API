import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Overtime } from '@/entities/hr/overtime';

export interface CreateOvertimeSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  date: Date;
  hours: number;
  reason: string;
}

export interface UpdateOvertimeSchema {
  id: UniqueEntityID;
  date?: Date;
  hours?: number;
  reason?: string;
  approved?: boolean;
  approvedBy?: UniqueEntityID;
  approvedAt?: Date;
}

export interface FindOvertimeFilters {
  employeeId?: UniqueEntityID;
  startDate?: Date;
  endDate?: Date;
  approved?: boolean;
}

export interface PaginatedOvertimeResult {
  overtimes: Overtime[];
  total: number;
}

export interface OvertimeRepository {
  create(data: CreateOvertimeSchema): Promise<Overtime>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Overtime | null>;
  findMany(
    tenantId: string,
    filters?: FindOvertimeFilters,
  ): Promise<Overtime[]>;
  findManyPaginated(
    tenantId: string,
    filters: FindOvertimeFilters,
    skip: number,
    take: number,
  ): Promise<PaginatedOvertimeResult>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Overtime[]>;
  findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Overtime[]>;
  findManyPending(tenantId: string): Promise<Overtime[]>;
  findManyApproved(tenantId: string): Promise<Overtime[]>;
  update(data: UpdateOvertimeSchema): Promise<Overtime | null>;
  save(overtime: Overtime): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
