import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  PPEAssignmentStatus,
  PPECondition,
} from '@/entities/hr/ppe-assignment';
import type { PPEAssignment as PrismaPPEAssignment } from '@prisma/generated/client.js';

export function mapPPEAssignmentPrismaToDomain(record: PrismaPPEAssignment) {
  return {
    tenantId: new UniqueEntityID(record.tenantId),
    ppeItemId: new UniqueEntityID(record.ppeItemId),
    employeeId: new UniqueEntityID(record.employeeId),
    assignedAt: record.assignedAt,
    returnedAt: record.returnedAt ?? undefined,
    expiresAt: record.expiresAt ?? undefined,
    condition: record.condition as PPECondition,
    returnCondition: record.returnCondition
      ? (record.returnCondition as PPECondition)
      : undefined,
    quantity: record.quantity,
    notes: record.notes ?? undefined,
    status: record.status as PPEAssignmentStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
