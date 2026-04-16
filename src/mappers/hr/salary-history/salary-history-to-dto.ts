import type {
  SalaryChangeReason,
  SalaryHistory,
} from '@/entities/hr/salary-history';

export interface SalaryHistoryDTO {
  id: string;
  employeeId: string;
  previousSalary: number | null;
  newSalary: number;
  reason: SalaryChangeReason;
  notes: string | null;
  effectiveDate: Date;
  changedBy: string;
  createdAt: Date;
}

export function salaryHistoryToDTO(record: SalaryHistory): SalaryHistoryDTO {
  return {
    id: record.id.toString(),
    employeeId: record.employeeId.toString(),
    previousSalary: record.previousSalary ?? null,
    newSalary: record.newSalary,
    reason: record.reason,
    notes: record.notes ?? null,
    effectiveDate: record.effectiveDate,
    changedBy: record.changedBy.toString(),
    createdAt: record.createdAt,
  };
}
