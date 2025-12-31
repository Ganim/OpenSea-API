export { mapDeductionPrismaToDomain } from './deduction-prisma-to-domain';

// Direct exports from deduction-to-dto
export interface DeductionDTO {
  id: string;
  employeeId: string;
  name: string;
  amount: number;
  reason: string;
  date: string;
  isRecurring: boolean;
  installments: number | null;
  currentInstallment: number | null;
  remainingInstallments: number;
  installmentAmount: number;
  isApplied: boolean;
  appliedAt: string | null;
  payrollId: string | null;
  createdAt: string;
  updatedAt: string;
}

export { deductionToDTO } from './deduction-to-dto';
