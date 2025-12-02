import type { Bonus } from '@/entities/hr/bonus';

export interface BonusDTO {
  id: string;
  employeeId: string;
  name: string;
  amount: number;
  reason: string;
  date: string;
  isPaid: boolean;
  paidAt: string | null;
  payrollId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function bonusToDTO(bonus: Bonus): BonusDTO {
  return {
    id: bonus.id.toString(),
    employeeId: bonus.employeeId.toString(),
    name: bonus.name,
    amount: bonus.amount,
    reason: bonus.reason,
    date: bonus.date.toISOString(),
    isPaid: bonus.isPaid,
    paidAt: bonus.paidAt?.toISOString() ?? null,
    payrollId: bonus.payrollId?.toString() ?? null,
    createdAt: bonus.createdAt.toISOString(),
    updatedAt: bonus.updatedAt.toISOString(),
  };
}
