import type { Overtime } from '@/entities/hr/overtime';

export interface OvertimeDTO {
  id: string;
  employeeId: string;
  date: Date;
  hours: number;
  reason: string;
  approved: boolean;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function overtimeToDTO(overtime: Overtime): OvertimeDTO {
  return {
    id: overtime.id.toString(),
    employeeId: overtime.employeeId.toString(),
    date: overtime.date,
    hours: overtime.hours,
    reason: overtime.reason,
    approved: overtime.approved,
    approvedBy: overtime.approvedBy?.toString() ?? null,
    approvedAt: overtime.approvedAt ?? null,
    createdAt: overtime.createdAt,
    updatedAt: overtime.updatedAt,
  };
}
