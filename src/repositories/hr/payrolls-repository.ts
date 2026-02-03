import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';

export interface CreatePayrollSchema {
  tenantId: string;
  referenceMonth: number;
  referenceYear: number;
  totalGross?: number;
  totalDeductions?: number;
}

export interface UpdatePayrollSchema {
  id: UniqueEntityID;
  status?: string;
  totalGross?: number;
  totalDeductions?: number;
  processedBy?: UniqueEntityID;
  processedAt?: Date;
  approvedBy?: UniqueEntityID;
  approvedAt?: Date;
  paidBy?: UniqueEntityID;
  paidAt?: Date;
}

export interface FindPayrollFilters {
  referenceMonth?: number;
  referenceYear?: number;
  status?: string;
}

export interface PayrollsRepository {
  create(data: CreatePayrollSchema): Promise<Payroll>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Payroll | null>;
  findByPeriod(
    referenceMonth: number,
    referenceYear: number,
    tenantId: string,
  ): Promise<Payroll | null>;
  findMany(tenantId: string, filters?: FindPayrollFilters): Promise<Payroll[]>;
  findManyByYear(year: number, tenantId: string): Promise<Payroll[]>;
  findManyByStatus(status: string, tenantId: string): Promise<Payroll[]>;
  update(data: UpdatePayrollSchema): Promise<Payroll | null>;
  save(payroll: Payroll): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
