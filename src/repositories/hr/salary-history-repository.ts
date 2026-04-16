import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  SalaryChangeReason,
  SalaryHistory,
} from '@/entities/hr/salary-history';

export interface CreateSalaryHistorySchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  previousSalary?: number;
  newSalary: number;
  reason: SalaryChangeReason;
  notes?: string;
  effectiveDate: Date;
  changedBy: UniqueEntityID;
}

export interface SalaryHistoryRepository {
  create(data: CreateSalaryHistorySchema): Promise<SalaryHistory>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<SalaryHistory[]>;
  findLatestByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<SalaryHistory | null>;
}
