import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deduction } from '@/entities/hr/deduction';

export interface CreateDeductionSchema {
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
  findById(id: UniqueEntityID): Promise<Deduction | null>;
  findMany(filters?: FindDeductionFilters): Promise<Deduction[]>;
  findManyByEmployee(employeeId: UniqueEntityID): Promise<Deduction[]>;
  findManyPending(): Promise<Deduction[]>;
  findManyPendingByEmployee(employeeId: UniqueEntityID): Promise<Deduction[]>;
  findPendingByEmployee(employeeId: UniqueEntityID): Promise<Deduction[]>;
  findManyRecurring(): Promise<Deduction[]>;
  findManyRecurringByEmployee(employeeId: UniqueEntityID): Promise<Deduction[]>;
  findManyByPeriod(startDate: Date, endDate: Date): Promise<Deduction[]>;
  sumPendingByEmployee(employeeId: UniqueEntityID): Promise<number>;
  update(data: UpdateDeductionSchema): Promise<Deduction | null>;
  save(deduction: Deduction): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
