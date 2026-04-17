import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreatePayrollSchema {
  tenantId: string;
  referenceMonth: number;
  referenceYear: number;
  totalGross?: number;
  totalDeductions?: number;
}

export interface UpdatePayrollSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
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
  page?: number;
  perPage?: number;
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
  save(payroll: Payroll, tx?: TransactionClient): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
