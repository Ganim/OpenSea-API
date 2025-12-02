import type { Absence } from '@/entities/hr/absence';

export interface AbsenceDTO {
  id: string;
  employeeId: string;
  type: string;
  status: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason?: string | null;
  documentUrl?: string | null;
  cid?: string | null;
  isPaid: boolean;
  requestedBy?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function absenceToDTO(absence: Absence): AbsenceDTO {
  return {
    id: absence.id.toString(),
    employeeId: absence.employeeId.toString(),
    type: absence.type.value,
    status: absence.status.value,
    startDate: absence.startDate,
    endDate: absence.endDate,
    totalDays: absence.totalDays,
    reason: absence.reason ?? null,
    documentUrl: absence.documentUrl ?? null,
    cid: absence.cid ?? null,
    isPaid: absence.isPaid,
    requestedBy: absence.requestedBy?.toString() ?? null,
    approvedBy: absence.approvedBy?.toString() ?? null,
    approvedAt: absence.approvedAt ?? null,
    rejectionReason: absence.rejectionReason ?? null,
    notes: absence.notes ?? null,
    createdAt: absence.createdAt,
    updatedAt: absence.updatedAt,
  };
}
