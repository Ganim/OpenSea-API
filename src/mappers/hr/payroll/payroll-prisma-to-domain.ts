import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PayrollStatus } from '@/entities/hr/value-objects';
import type {
  Payroll as PrismaPayroll,
  PayrollItem as PrismaPayrollItem,
} from '@prisma/client';

type PayrollWithItems = PrismaPayroll & {
  items?: PrismaPayrollItem[];
};

export function mapPayrollPrismaToDomain(payroll: PayrollWithItems) {
  return {
    referenceMonth: payroll.referenceMonth,
    referenceYear: payroll.referenceYear,
    status: PayrollStatus.create(payroll.status),
    totalGross: Number(payroll.totalGross),
    totalDeductions: Number(payroll.totalDeductions),
    totalNet: Number(payroll.totalNet),
    processedAt: payroll.processedAt ?? undefined,
    processedBy: payroll.processedBy
      ? new UniqueEntityID(payroll.processedBy)
      : undefined,
    approvedAt: payroll.approvedAt ?? undefined,
    approvedBy: payroll.approvedBy
      ? new UniqueEntityID(payroll.approvedBy)
      : undefined,
    paidAt: payroll.paidAt ?? undefined,
    paidBy: payroll.paidBy ? new UniqueEntityID(payroll.paidBy) : undefined,
    createdAt: payroll.createdAt,
    updatedAt: payroll.updatedAt,
  };
}
