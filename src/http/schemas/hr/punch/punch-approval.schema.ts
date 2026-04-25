import { z } from 'zod';

/**
 * Zod schemas dos endpoints de PunchApproval. Named schemas (ADR-017).
 *
 * Diferente de PunchDevice, aqui não há segredos a ocultar — `details` é
 * um Record<string, unknown> com dados de GPS (distância, zone) que são
 * insumo para decisão do gestor e devem aparecer na resposta.
 */

export const punchApprovalStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const punchApprovalReasonEnum = z.enum([
  'OUT_OF_GEOFENCE',
  'FACE_MATCH_LOW',
  // Phase 8 / Plan 08-01 (D-07/D-08): funcionário antecipa justificativa pela
  // PWA pessoal — bate atestado, esquece de bater, falta com motivo.
  'EMPLOYEE_SELF_REQUEST',
]);

// ────────────────────────────────────────────────────────────────────
// LIST
// ────────────────────────────────────────────────────────────────────

export const listPunchApprovalsQuerySchema = z.object({
  status: punchApprovalStatusEnum.optional(),
  reason: punchApprovalReasonEnum.optional(),
  employeeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Phase 7 / Plan 07-03 — D-10: evidenceFiles + linkedRequest (snapshot).
 * Shape restrita da EvidenceFile para mitigar T-7-01-01 (tampering JSONB).
 */
export const evidenceFileSchema = z.object({
  storageKey: z.string(),
  filename: z.string(),
  size: z.number().int().nonnegative(),
  uploadedAt: z.string(),
  uploadedBy: z.string(),
});

export const linkedRequestSnapshotSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(),
});

export const punchApprovalDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  // Phase 8 / Plan 08-01 (D-07): nullable para self-create cenário 2.
  timeEntryId: z.string().nullable(),
  employeeId: z.string(),
  reason: punchApprovalReasonEnum,
  details: z.record(z.string(), z.unknown()).nullable(),
  status: punchApprovalStatusEnum,
  resolverUserId: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  resolverNote: z.string().nullable(),
  // Phase 7 / Plan 07-03 — D-10: evidenceFiles sempre retornado (default []);
  // linkedRequest opcional porque o mapper só popula quando o caller
  // já resolveu o snapshot do EmployeeRequest (controllers Phase 7).
  evidenceFiles: z.array(evidenceFileSchema),
  linkedRequest: linkedRequestSnapshotSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const listPunchApprovalsResponseSchema = z.object({
  items: z.array(punchApprovalDtoSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

// ────────────────────────────────────────────────────────────────────
// RESOLVE
// ────────────────────────────────────────────────────────────────────

export const punchApprovalParamsSchema = z.object({
  id: z.string().uuid(),
});

/**
 * Phase 7 / Plan 07-03 — D-09/D-10: extensão opcional do resolve body com
 * evidências (storageKeys já enviadas via endpoint de upload separado) e
 * cross-ref a EmployeeRequest.
 */
export const resolvePunchApprovalBodySchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(1000).optional(),
  evidenceFileKeys: z.array(z.string().min(1)).max(10).optional(),
  linkedRequestId: z.string().uuid().optional(),
});

export const resolvePunchApprovalResponseSchema = z.object({
  approvalId: z.string().uuid(),
  status: z.enum(['APPROVED', 'REJECTED']),
  resolvedAt: z.string(),
});

// ────────────────────────────────────────────────────────────────────
// BATCH RESOLVE (Phase 7 / Plan 07-03 — D-09)
// ────────────────────────────────────────────────────────────────────

/**
 * Lote máximo de 100 aprovações por request (anti-DoS). Frontend deve
 * chunkar listas maiores em múltiplos requests. `evidenceFileKeys` +
 * `linkedRequestId` são SHARED entre todas as aprovações do lote.
 */
export const batchResolvePunchApprovalsBodySchema = z.object({
  approvalIds: z.array(z.string().uuid()).min(1).max(100),
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(1000).optional(),
  evidenceFileKeys: z.array(z.string().min(1)).max(10).optional(),
  linkedRequestId: z.string().uuid().optional(),
});

export const batchResolvePunchApprovalsResultItemSchema = z.object({
  approvalId: z.string().uuid(),
  success: z.boolean(),
  error: z.string().optional(),
});

export const batchResolvePunchApprovalsResponseSchema = z.object({
  results: z.array(batchResolvePunchApprovalsResultItemSchema),
  totalSucceeded: z.number().int().nonnegative(),
  totalFailed: z.number().int().nonnegative(),
});

// ────────────────────────────────────────────────────────────────────
// EVIDENCE UPLOAD (Phase 7 / Plan 07-03 — D-10)
// ────────────────────────────────────────────────────────────────────

export const uploadPunchApprovalEvidenceResponseSchema = z.object({
  storageKey: z.string(),
  size: z.number().int().positive(),
  uploadedAt: z.string(),
  filename: z.string(),
});

// ────────────────────────────────────────────────────────────────────
// CREATE SELF (Phase 8 / Plan 08-01 — D-07/D-08)
// ────────────────────────────────────────────────────────────────────
//
// Endpoint: POST /v1/hr/punch-approvals
//
// Funcionário comum (`hr.punch-approvals.access`) cria uma aprovação PENDING
// para si próprio a partir da PWA pessoal. Dois cenários atendidos:
//
//  1) Justificar batida existente flagueada (timeEntryId).
//  2) Solicitar a criação de uma batida ausente
//     (proposedTimestamp + entryType — sem timeEntryId).
//
// O refine garante mutual exclusion mínima (pelo menos um dos dois caminhos).
// `evidenceFileKeys.max(3)` honra D-08 (até 3 arquivos × 5MB).

export const createSelfPunchApprovalBodySchema = z
  .object({
    timeEntryId: z.string().uuid().optional(),
    proposedTimestamp: z.string().datetime().optional(),
    entryType: z
      .enum(['CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END'])
      .optional(),
    reason: z.enum([
      'OUT_OF_GEOFENCE',
      'FACE_MATCH_LOW',
      'EMPLOYEE_SELF_REQUEST',
    ]),
    note: z.string().min(10).max(1000).optional(),
    evidenceFileKeys: z.array(z.string().min(1)).max(3).optional(),
  })
  .refine(
    (data) =>
      Boolean(data.timeEntryId) ||
      Boolean(data.proposedTimestamp && data.entryType),
    {
      message: 'timeEntryId OR (proposedTimestamp + entryType) é obrigatório',
    },
  );

export const createSelfPunchApprovalResponseSchema = z.object({
  approvalId: z.string().uuid(),
  status: z.literal('PENDING'),
  createdAt: z.string(),
});
