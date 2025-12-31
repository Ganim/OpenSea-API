import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PayrollItem } from '@/entities/hr/payroll-item';

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
  create(data: CreatePayrollItemSchema): Promise<PayrollItem>;
  createMany(data: CreatePayrollItemSchema[]): Promise<PayrollItem[]>;
  findById(id: UniqueEntityID): Promise<PayrollItem | null>;
  findMany(filters?: FindPayrollItemFilters): Promise<PayrollItem[]>;
  findManyByPayroll(payrollId: UniqueEntityID): Promise<PayrollItem[]>;
  findManyByEmployee(employeeId: UniqueEntityID): Promise<PayrollItem[]>;
  findManyByPayrollAndEmployee(
    payrollId: UniqueEntityID,
    employeeId: UniqueEntityID,
  ): Promise<PayrollItem[]>;
  sumByPayroll(
    payrollId: UniqueEntityID,
  ): Promise<{ totalGross: number; totalDeductions: number }>;
  sumByPayrollAndEmployee(
    payrollId: UniqueEntityID,
    employeeId: UniqueEntityID,
  ): Promise<{ totalGross: number; totalDeductions: number }>;
  update(data: UpdatePayrollItemSchema): Promise<PayrollItem | null>;
  delete(id: UniqueEntityID): Promise<void>;
  deleteByPayroll(payrollId: UniqueEntityID): Promise<void>;
}
