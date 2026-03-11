import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PayrollItem } from '@/entities/hr/payroll-item';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreatePayrollItemSchema {
  payrollId: UniqueEntityID;
  employeeId: UniqueEntityID;
  type: string;
  description: string;
  amount: number;
  isDeduction?: boolean;
  referenceId?: string;
  referenceType?: string;
}

export interface UpdatePayrollItemSchema {
  id: UniqueEntityID;
  description?: string;
  amount?: number;
}

export interface FindPayrollItemFilters {
  payrollId?: UniqueEntityID;
  employeeId?: UniqueEntityID;
  type?: string;
  isDeduction?: boolean;
}

export interface PayrollItemsRepository {
  create(
    data: CreatePayrollItemSchema,
    tx?: TransactionClient,
  ): Promise<PayrollItem>;
  createMany(
    data: CreatePayrollItemSchema[],
    tx?: TransactionClient,
  ): Promise<PayrollItem[]>;
  findById(id: UniqueEntityID): Promise<PayrollItem | null>;
  findMany(filters?: FindPayrollItemFilters): Promise<PayrollItem[]>;
  findManyByPayroll(
    payrollId: UniqueEntityID,
    tx?: TransactionClient,
  ): Promise<PayrollItem[]>;
  findManyByEmployee(employeeId: UniqueEntityID): Promise<PayrollItem[]>;
  findManyByPayrollAndEmployee(
    payrollId: UniqueEntityID,
    employeeId: UniqueEntityID,
  ): Promise<PayrollItem[]>;
  sumByPayroll(
    payrollId: UniqueEntityID,
    tx?: TransactionClient,
  ): Promise<{ totalGross: number; totalDeductions: number }>;
  sumByPayrollAndEmployee(
    payrollId: UniqueEntityID,
    employeeId: UniqueEntityID,
  ): Promise<{ totalGross: number; totalDeductions: number }>;
  update(data: UpdatePayrollItemSchema): Promise<PayrollItem | null>;
  delete(id: UniqueEntityID): Promise<void>;
  deleteByPayroll(payrollId: UniqueEntityID): Promise<void>;
}
