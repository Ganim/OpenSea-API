import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deduction } from '@/entities/hr/deduction';

export interface CreateDeductionSchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  name: string;
  amount: number;
  reason: string;
  date: Date;
  isRecurring?: boolean;
  installments?: number;
}

export interface UpdateDeductionSchema {
  id: UniqueEntityID;
  name?: string;
  amount?: number;
  reason?: string;
  date?: Date;
  isRecurring?: boolean;
  installments?: number;
  currentInstallment?: number;
  isApplied?: boolean;
  appliedAt?: Date;
  payrollId?: UniqueEntityID;
}

export interface FindDeductionFilters {
  employeeId?: UniqueEntityID;
  isApplied?: boolean;
  isRecurring?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface DeductionsRepository {
  create(data: CreateDeductionSchema): Promise<Deduction>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Deduction | null>;
  findMany(
    tenantId: string,
    filters?: FindDeductionFilters,
  ): Promise<Deduction[]>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction[]>;
  findManyPending(tenantId: string): Promise<Deduction[]>;
  findManyPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction[]>;
  findPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction[]>;
  findManyRecurring(tenantId: string): Promise<Deduction[]>;
  findManyRecurringByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction[]>;
  findManyByPeriod(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Deduction[]>;
  sumPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<number>;
  update(data: UpdateDeductionSchema): Promise<Deduction | null>;
  save(deduction: Deduction): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
