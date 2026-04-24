/**
 * Phase 07 / Plan 07-04 — Zod schemas do endpoint de export em lote.
 *
 * POST /v1/hr/punch/exports
 *
 * - Body:
 *   - `format`: CSV | PDF | AFD | AFDT
 *   - `startDate` / `endDate`: YYYY-MM-DD (date-only)
 *   - `employeeIds`, `departmentIds`, `cnpj`, `separator`: filtros opcionais
 *   - Refine 365 dias máximo (paridade com Phase 6 AFD — D-02).
 * - Response:
 *   - `mode=sync`: 200 com artifact response (jobId/downloadUrl/...)
 *   - `mode=async`: 202 com `{ jobId, message }`
 */

import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PERIOD_DAYS = 365;

export const exportPunchBatchBodySchema = z
  .object({
    format: z.enum(['CSV', 'PDF', 'AFD', 'AFDT']),
    startDate: z.string().regex(DATE_REGEX, 'Use formato YYYY-MM-DD'),
    endDate: z.string().regex(DATE_REGEX, 'Use formato YYYY-MM-DD'),
    employeeIds: z.array(z.string().uuid()).max(500).optional(),
    departmentIds: z.array(z.string().uuid()).max(100).optional(),
    cnpj: z
      .string()
      .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos')
      .optional(),
    separator: z.enum([',', ';']).optional(),
  })
  .refine(
    (b) => {
      const start = new Date(`${b.startDate}T00:00:00.000Z`).getTime();
      const end = new Date(`${b.endDate}T23:59:59.999Z`).getTime();
      return end >= start;
    },
    { message: 'endDate deve ser >= startDate' },
  )
  .refine(
    (b) => {
      const start = new Date(`${b.startDate}T00:00:00.000Z`).getTime();
      const end = new Date(`${b.endDate}T23:59:59.999Z`).getTime();
      const diffDays = (end - start) / (1000 * 60 * 60 * 24);
      return diffDays <= MAX_PERIOD_DAYS;
    },
    { message: `Período máximo ${MAX_PERIOD_DAYS} dias` },
  );

export type ExportPunchBatchBody = z.infer<typeof exportPunchBatchBodySchema>;

export const exportPunchBatchSyncResponseSchema = z.object({
  mode: z.literal('sync'),
  response: z.object({
    jobId: z.string().uuid(),
    storageKey: z.string(),
    contentHash: z.string(),
    sizeBytes: z.number().int().positive(),
    downloadUrl: z.string().url(),
  }),
});

export const exportPunchBatchAsyncResponseSchema = z.object({
  mode: z.literal('async'),
  jobId: z.string().uuid(),
  message: z.string(),
});

export const exportPunchBatchResponseSchema = z.union([
  exportPunchBatchSyncResponseSchema,
  exportPunchBatchAsyncResponseSchema,
]);
