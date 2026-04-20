import { z } from 'zod';

/**
 * Zod schemas for GET /v1/hr/crachas (Plan 05-04 — admin listing of
 * employees with QR rotation status for the crachás panel).
 *
 * Named exports per ADR-017.
 */

export const listCrachasQuerySchema = z.object({
  departmentId: z.string().uuid().optional(),
  rotationStatus: z.enum(['active', 'recent', 'never']).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const listCrachasItemSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  registration: z.string(),
  photoUrl: z.string().nullable(),
  departmentName: z.string().nullable(),
  qrTokenSetAt: z.string().nullable(),
  rotationStatus: z.enum(['active', 'recent', 'never']),
});

export const listCrachasResponseSchema = z.object({
  items: z.array(listCrachasItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
});
