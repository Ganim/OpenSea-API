import type { PunchApproval } from '@/entities/hr/punch-approval';

/**
 * DTO público do PunchApproval.
 *
 * Todos os campos da entity são expostos — diferente do `PunchDevice`
 * (onde `pairingSecret`/`deviceTokenHash` são segredos), o `PunchApproval`
 * não carrega material sensível. O `resolverNote` pode conter detalhes
 * da decisão do gestor e fica visível para quem tem permissão de leitura.
 *
 * `details` é um record JSON com dados específicos do motivo — para
 * `OUT_OF_GEOFENCE` contém `{ distance, zoneId, accuracy? }`.
 */
export interface PunchApprovalDTO {
  id: string;
  tenantId: string;
  timeEntryId: string;
  employeeId: string;
  reason: 'OUT_OF_GEOFENCE';
  details: Record<string, unknown> | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  resolverUserId: string | null;
  resolvedAt: string | null;
  resolverNote: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export function punchApprovalToDTO(approval: PunchApproval): PunchApprovalDTO {
  return {
    id: approval.id.toString(),
    tenantId: approval.tenantId.toString(),
    timeEntryId: approval.timeEntryId.toString(),
    employeeId: approval.employeeId.toString(),
    reason: approval.reason,
    details: approval.details ?? null,
    status: approval.status,
    resolverUserId: approval.resolverUserId?.toString() ?? null,
    resolvedAt: approval.resolvedAt?.toISOString() ?? null,
    resolverNote: approval.resolverNote ?? null,
    createdAt: approval.createdAt.toISOString(),
    updatedAt: approval.updatedAt?.toISOString() ?? null,
  };
}
