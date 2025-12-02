import type { Payroll } from '@/entities/hr/payroll';

export interface PayrollDTO {
  id: string;
  referenceMonth: number;
  referenceYear: number;
  referencePeriod: string;
  status: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  processedAt: string | null;
  processedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  paidAt: string | null;
  paidBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function payrollToDTO(payroll: Payroll): PayrollDTO {
  return {
    id: payroll.id.toString(),
    referenceMonth: payroll.referenceMonth,
    referenceYear: payroll.referenceYear,
    referencePeriod: payroll.referencePeriod,
    status: payroll.status.value,
    totalGross: payroll.totalGross,
    totalDeductions: payroll.totalDeductions,
    totalNet: payroll.totalNet,
    employeeCount: payroll.employeeCount,
    processedAt: payroll.processedAt?.toISOString() ?? null,
    processedBy: payroll.processedBy?.toString() ?? null,
    approvedAt: payroll.approvedAt?.toISOString() ?? null,
    approvedBy: payroll.approvedBy?.toString() ?? null,
    paidAt: payroll.paidAt?.toISOString() ?? null,
    paidBy: payroll.paidBy?.toString() ?? null,
    createdAt: payroll.createdAt.toISOString(),
    updatedAt: payroll.updatedAt.toISOString(),
  };
}
