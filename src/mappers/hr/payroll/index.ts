export { mapPayrollPrismaToDomain } from './payroll-prisma-to-domain';

// Direct exports from payroll-to-dto
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

export { payrollToDTO } from './payroll-to-dto';

