import type { ShiftAssignment } from '@/entities/hr/shift-assignment';

export interface ShiftAssignmentDTO {
  id: string;
  shiftId: string;
  employeeId: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function shiftAssignmentToDTO(
  assignment: ShiftAssignment,
): ShiftAssignmentDTO {
  return {
    id: assignment.id.toString(),
    shiftId: assignment.shiftId.toString(),
    employeeId: assignment.employeeId.toString(),
    startDate: assignment.startDate,
    endDate: assignment.endDate ?? null,
    isActive: assignment.isActive,
    notes: assignment.notes ?? null,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}
