import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  WarningSeverity,
  WarningStatus,
  WarningType,
} from '@/entities/hr/value-objects';
import type { EmployeeWarning as PrismaEmployeeWarning } from '@prisma/generated/client.js';

export function mapEmployeeWarningPrismaToDomain(
  warning: PrismaEmployeeWarning,
) {
  return {
    tenantId: new UniqueEntityID(warning.tenantId),
    employeeId: new UniqueEntityID(warning.employeeId),
    issuedBy: new UniqueEntityID(warning.issuedBy),
    type: WarningType.create(warning.type),
    severity: WarningSeverity.create(warning.severity),
    status: WarningStatus.create(warning.status),
    reason: warning.reason,
    description: warning.description ?? undefined,
    incidentDate: warning.incidentDate,
    witnessName: warning.witnessName ?? undefined,
    employeeAcknowledged: warning.employeeAcknowledged,
    acknowledgedAt: warning.acknowledgedAt ?? undefined,
    suspensionDays: warning.suspensionDays ?? undefined,
    attachmentUrl: warning.attachmentUrl ?? undefined,
    revokedAt: warning.revokedAt ?? undefined,
    revokeReason: warning.revokeReason ?? undefined,
    deletedAt: warning.deletedAt ?? undefined,
    deletedBy: warning.deletedBy ?? undefined,
    createdAt: warning.createdAt,
    updatedAt: warning.updatedAt,
  };
}
