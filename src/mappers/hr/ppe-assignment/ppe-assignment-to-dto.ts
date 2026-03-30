import type { PPEAssignment } from '@/entities/hr/ppe-assignment';

export interface PPEAssignmentDTO {
  id: string;
  ppeItemId: string;
  employeeId: string;
  assignedAt: string;
  returnedAt: string | null;
  expiresAt: string | null;
  condition: string;
  returnCondition: string | null;
  quantity: number;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function ppeAssignmentToDTO(
  assignment: PPEAssignment,
): PPEAssignmentDTO {
  return {
    id: assignment.id.toString(),
    ppeItemId: assignment.ppeItemId.toString(),
    employeeId: assignment.employeeId.toString(),
    assignedAt: assignment.assignedAt.toISOString(),
    returnedAt: assignment.returnedAt?.toISOString() ?? null,
    expiresAt: assignment.expiresAt?.toISOString() ?? null,
    condition: assignment.condition,
    returnCondition: assignment.returnCondition ?? null,
    quantity: assignment.quantity,
    notes: assignment.notes ?? null,
    status: assignment.status,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}
