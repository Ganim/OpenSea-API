import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ShiftAssignment as PrismaShiftAssignment } from '@prisma/generated/client.js';

export function mapShiftAssignmentPrismaToDomain(
  assignment: PrismaShiftAssignment,
) {
  return {
    tenantId: new UniqueEntityID(assignment.tenantId),
    shiftId: new UniqueEntityID(assignment.shiftId),
    employeeId: new UniqueEntityID(assignment.employeeId),
    startDate: assignment.startDate,
    endDate: assignment.endDate ?? undefined,
    isActive: assignment.isActive,
    notes: assignment.notes ?? undefined,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}
