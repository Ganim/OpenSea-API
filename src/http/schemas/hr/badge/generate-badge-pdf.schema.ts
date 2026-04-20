import { z } from 'zod';

/**
 * Zod schemas for POST /v1/hr/employees/:id/badge-pdf (Plan 05-06 Task 3).
 *
 * The response is a binary `application/pdf` stream — no Zod schema for the
 * 200 body. Only the params + 404 payloads are validated here.
 *
 * Named exports per ADR-017.
 */

export const generateBadgePdfParamsSchema = z.object({
  id: z.string().uuid(),
});

export const generateBadgePdfErrorResponseSchema = z.object({
  message: z.string(),
});
