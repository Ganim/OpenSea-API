import type { EvidenceFile, PunchApproval } from '@/entities/hr/punch-approval';

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
 *
 * Phase 7 / Plan 07-03 — D-09/D-10:
 * - `evidenceFiles[]`: arquivos PDF anexados ao resolve (5 anos retenção
 *   Portaria 671). Array vazio quando nenhuma evidência foi anexada.
 * - `linkedRequest`: snapshot opcional do `EmployeeRequest` linkado
 *   (atestado/justificativa aprovado). Populado pelo caller quando o
 *   request já foi resolvido; `null` quando não há link ou o use case
 *   optou por não resolvê-lo.
 */
export interface LinkedRequestSnapshot {
  id: string;
  type: string;
  status: string;
}

export interface PunchApprovalDTO {
  id: string;
  tenantId: string;
  // Phase 8 / Plan 08-01 (D-07): nullable para self-create cenário 2.
  timeEntryId: string | null;
  employeeId: string;
  reason: 'OUT_OF_GEOFENCE' | 'FACE_MATCH_LOW' | 'EMPLOYEE_SELF_REQUEST';
  details: Record<string, unknown> | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  resolverUserId: string | null;
  resolvedAt: string | null;
  resolverNote: string | null;
  evidenceFiles: EvidenceFile[];
  linkedRequest: LinkedRequestSnapshot | null;
  createdAt: string;
  updatedAt: string | null;
}

export function punchApprovalToDTO(
  approval: PunchApproval,
  linkedRequest?: LinkedRequestSnapshot | null,
): PunchApprovalDTO {
  return {
    id: approval.id.toString(),
    tenantId: approval.tenantId.toString(),
    timeEntryId: approval.timeEntryId?.toString() ?? null,
    employeeId: approval.employeeId.toString(),
    reason: approval.reason,
    details: approval.details ?? null,
    status: approval.status,
    resolverUserId: approval.resolverUserId?.toString() ?? null,
    resolvedAt: approval.resolvedAt?.toISOString() ?? null,
    resolverNote: approval.resolverNote ?? null,
    evidenceFiles: approval.evidenceFiles,
    linkedRequest: linkedRequest ?? null,
    createdAt: approval.createdAt.toISOString(),
    updatedAt: approval.updatedAt?.toISOString() ?? null,
  };
}
