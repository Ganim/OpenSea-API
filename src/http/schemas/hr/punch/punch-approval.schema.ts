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

export const punchApprovalReasonEnum = z.enum(['OUT_OF_GEOFENCE']);

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

export const punchApprovalDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  timeEntryId: z.string(),
  employeeId: z.string(),
  reason: punchApprovalReasonEnum,
  details: z.record(z.string(), z.unknown()).nullable(),
  status: punchApprovalStatusEnum,
  resolverUserId: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  resolverNote: z.string().nullable(),
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

export const resolvePunchApprovalBodySchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(1000).optional(),
});

export const resolvePunchApprovalResponseSchema = z.object({
  approvalId: z.string().uuid(),
  status: z.enum(['APPROVED', 'REJECTED']),
  resolvedAt: z.string(),
});
