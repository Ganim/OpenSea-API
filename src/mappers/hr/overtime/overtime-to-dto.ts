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
  rejected: boolean;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
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
    rejected: overtime.rejected,
    rejectedBy: overtime.rejectedBy?.toString() ?? null,
    rejectedAt: overtime.rejectedAt ?? null,
    rejectionReason: overtime.rejectionReason ?? null,
    createdAt: overtime.createdAt,
    updatedAt: overtime.updatedAt,
  };
}
