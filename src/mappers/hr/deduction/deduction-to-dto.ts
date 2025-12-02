import type { Deduction } from '@/entities/hr/deduction';

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

export function deductionToDTO(deduction: Deduction): DeductionDTO {
  return {
    id: deduction.id.toString(),
    employeeId: deduction.employeeId.toString(),
    name: deduction.name,
    amount: deduction.amount,
    reason: deduction.reason,
    date: deduction.date.toISOString(),
    isRecurring: deduction.isRecurring,
    installments: deduction.installments ?? null,
    currentInstallment: deduction.currentInstallment ?? null,
    remainingInstallments: deduction.getRemainingInstallments(),
    installmentAmount: deduction.getInstallmentAmount(),
    isApplied: deduction.isApplied,
    appliedAt: deduction.appliedAt?.toISOString() ?? null,
    payrollId: deduction.payrollId?.toString() ?? null,
    createdAt: deduction.createdAt.toISOString(),
    updatedAt: deduction.updatedAt.toISOString(),
  };
}
