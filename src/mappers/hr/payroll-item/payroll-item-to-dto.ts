import type { PayrollItem } from '@/entities/hr/payroll-item';

export interface PayrollItemDTO {
  id: string;
  payrollId: string;
  employeeId: string;
  type: string;
  description: string;
  amount: number;
  isDeduction: boolean;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
  updatedAt: string;
}

export function payrollItemToDTO(item: PayrollItem): PayrollItemDTO {
  return {
    id: item.id.toString(),
    payrollId: item.payrollId.toString(),
    employeeId: item.employeeId.toString(),
    type: item.type.value,
    description: item.description,
    amount: item.amount,
    isDeduction: item.isDeduction,
    referenceId: item.referenceId ?? null,
    referenceType: item.referenceType ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
