/**
 * Zod schemas para a rota pública `GET /v1/public/punch/verify/:nsrHash`
 * (Phase 06 / Plan 06-03).
 *
 * Público = SEM AUTENTICAÇÃO. Cada campo exposto aqui vaza para a internet.
 * Qualquer adição precisa de assinatura LGPD — ver header gigante do mapper
 * `src/mappers/hr/public-receipt-mapper.ts`.
 */

import { z } from 'zod';

/**
 * Regex estrito — 64 chars hex lowercase (HMAC-SHA256 hex encode).
 * Bloqueia qualquer path traversal, query injection ou enumeração
 * sequencial antes de tocar o banco (T-06-03-04 mitigação).
 */
export const punchVerifyPublicParamsSchema = z.object({
  nsrHash: z.string().regex(/^[a-f0-9]{64}$/, 'Código inválido'),
});

export const punchVerifyPublicResponseSchema = z.object({
  employeeName: z.string(),
  tenantRazaoSocial: z.string(),
  tenantCnpjMasked: z.string(),
  nsrNumber: z.number().int().positive(),
  timestamp: z.string(),
  entryType: z.enum(['CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END']),
  entryTypeLabel: z.string(),
  status: z.enum(['APPROVED', 'PENDING_APPROVAL']),
});

export type PunchVerifyPublicResponse = z.infer<
  typeof punchVerifyPublicResponseSchema
>;
