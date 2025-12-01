import type { TimeBank } from '@/entities/hr/time-bank';

export interface TimeBankDTO {
  id: string;
  employeeId: string;
  balance: number;
  year: number;
  hasPositiveBalance: boolean;
  hasNegativeBalance: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function timeBankToDTO(timeBank: TimeBank): TimeBankDTO {
  return {
    id: timeBank.id.toString(),
    employeeId: timeBank.employeeId.toString(),
    balance: timeBank.balance,
    year: timeBank.year,
    hasPositiveBalance: timeBank.hasPositiveBalance(),
    hasNegativeBalance: timeBank.hasNegativeBalance(),
    createdAt: timeBank.createdAt,
    updatedAt: timeBank.updatedAt,
  };
}
