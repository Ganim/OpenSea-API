import type { EmployeeWarning } from '@/entities/hr/employee-warning';

export interface EmployeeWarningDTO {
  id: string;
  employeeId: string;
  issuedBy: string;
  type: string;
  severity: string;
  status: string;
  reason: string;
  description?: string | null;
  incidentDate: Date;
  witnessName?: string | null;
  employeeAcknowledged: boolean;
  acknowledgedAt?: Date | null;
  suspensionDays?: number | null;
  attachmentUrl?: string | null;
  revokedAt?: Date | null;
  revokeReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function employeeWarningToDTO(
  warning: EmployeeWarning,
): EmployeeWarningDTO {
  return {
    id: warning.id.toString(),
    employeeId: warning.employeeId.toString(),
    issuedBy: warning.issuedBy.toString(),
    type: warning.type.value,
    severity: warning.severity.value,
    status: warning.status.value,
    reason: warning.reason,
    description: warning.description ?? null,
    incidentDate: warning.incidentDate,
    witnessName: warning.witnessName ?? null,
    employeeAcknowledged: warning.employeeAcknowledged,
    acknowledgedAt: warning.acknowledgedAt ?? null,
    suspensionDays: warning.suspensionDays ?? null,
    attachmentUrl: warning.attachmentUrl ?? null,
    revokedAt: warning.revokedAt ?? null,
    revokeReason: warning.revokeReason ?? null,
    createdAt: warning.createdAt,
    updatedAt: warning.updatedAt,
  };
}
