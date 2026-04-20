import { z } from 'zod';

/**
 * Zod schemas for POST /v1/hr/employees/:id/face-enrollments.
 *
 * Named exports (ADR-017). The body enforces D-05 (3-5 photos) and D-07
 * (consent hash REQUIRED, sha256 hex). The response is metadata-only —
 * never includes embedding / iv / authTag (T-FACE-03 sentinel asserted in
 * the e2e spec).
 */

export const createFaceEnrollmentsParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createFaceEnrollmentsBodySchema = z.object({
  embeddings: z.array(z.array(z.number()).length(128)).min(3).max(5),
  // sha256 hex of the LGPD consent text the admin accepted (64 chars).
  consentTextHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const faceEnrollmentDtoSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  photoCount: z.number().int().positive(),
  capturedAt: z.string(),
  capturedByUserId: z.string(),
  createdAt: z.string(),
});

export const createFaceEnrollmentsResponseSchema = z.object({
  enrollments: z.array(faceEnrollmentDtoSchema),
  replacedCount: z.number().int().nonnegative(),
});

export const removeFaceEnrollmentsResponseSchema = z.object({
  removedCount: z.number().int().nonnegative(),
});
