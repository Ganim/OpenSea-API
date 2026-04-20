import { z } from 'zod';

/**
 * Zod schemas for POST /v1/hr/employees/:id/qr-token/rotate (Plan 05-04 /
 * D-14 individual). Named exports per ADR-017.
 */

export const rotateQrTokenParamsSchema = z.object({
  id: z.string().uuid(),
});

export const rotateQrTokenResponseSchema = z.object({
  /** 64-char lowercase hex token — the plaintext QR payload. */
  token: z.string().regex(/^[a-f0-9]{64}$/),
  /** ISO 8601 timestamp when the rotation landed. */
  rotatedAt: z.string(),
});
