/**
 * generate-folha-espelho.schema.ts — Phase 06 / Plan 06-04 Task 2
 *
 * Zod schemas para os endpoints:
 *  - POST /v1/hr/compliance/folhas-espelho (individual, 201)
 *  - POST /v1/hr/compliance/folhas-espelho/bulk (lote, 202)
 */

import { z } from 'zod';

const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/;

// ─── Individual ──────────────────────────────────────────────────────────────

export const folhaEspelhoIndividualBody = z.object({
  employeeId: z.string().uuid('employeeId deve ser UUID'),
  competencia: z
    .string()
    .regex(COMPETENCIA_REGEX, 'Use formato YYYY-MM (ex: 2026-03)'),
});

export type FolhaEspelhoIndividualBody = z.infer<
  typeof folhaEspelhoIndividualBody
>;

export const folhaEspelhoIndividualResponse = z.object({
  artifactId: z.string().uuid(),
  downloadUrl: z.string().url(),
  storageKey: z.string(),
  sizeBytes: z.number().int().positive(),
  contentHash: z.string().length(64),
});

export type FolhaEspelhoIndividualResponse = z.infer<
  typeof folhaEspelhoIndividualResponse
>;

// ─── Bulk ────────────────────────────────────────────────────────────────────

export const folhaEspelhoBulkBody = z
  .object({
    scope: z.enum(['ALL', 'DEPARTMENT', 'CUSTOM']),
    departmentIds: z
      .array(z.string().uuid())
      .max(50, 'Máximo 50 departamentos por chamada')
      .optional(),
    employeeIds: z
      .array(z.string().uuid())
      .max(500, 'Máximo 500 funcionários por lote — divida em lotes menores')
      .optional(),
    competencia: z
      .string()
      .regex(COMPETENCIA_REGEX, 'Use formato YYYY-MM (ex: 2026-03)'),
  })
  .refine(
    ({ scope, departmentIds, employeeIds }) => {
      if (
        scope === 'DEPARTMENT' &&
        (!departmentIds || departmentIds.length === 0)
      ) {
        return false;
      }
      if (scope === 'CUSTOM' && (!employeeIds || employeeIds.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message:
        'Informe departmentIds (scope=DEPARTMENT) ou employeeIds (scope=CUSTOM) conforme o scope escolhido.',
    },
  );

export type FolhaEspelhoBulkBody = z.infer<typeof folhaEspelhoBulkBody>;

export const folhaEspelhoBulkResponse = z.object({
  bulkJobId: z.string().uuid(),
  employeeCount: z.number().int().positive(),
  socketRoom: z
    .string()
    .describe('Room do Socket.IO que emite eventos de progresso'),
  progressEvent: z
    .string()
    .describe('Nome do evento Socket.IO emitido durante o processamento'),
});

export type FolhaEspelhoBulkResponse = z.infer<typeof folhaEspelhoBulkResponse>;
