import { z } from 'zod';

/**
 * Zod schemas for POST /v1/hr/qr-tokens/bulk-pdf (Plan 05-06 Task 3).
 *
 * Mirrors the shape of the QR rotation bulk schema so RH's frontend can
 * reuse the scope-selection modal with minimal divergence.
 *
 * Named exports per ADR-017.
 */

export const generateBulkBadgePdfsBodySchema = z
  .object({
    scope: z.enum(['ALL', 'DEPARTMENT', 'CUSTOM']),
    employeeIds: z.array(z.string().uuid()).optional(),
    departmentIds: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (d) => {
      if (d.scope === 'CUSTOM') {
        return (d.employeeIds?.length ?? 0) > 0;
      }
      if (d.scope === 'DEPARTMENT') {
        return (d.departmentIds?.length ?? 0) > 0;
      }
      return true;
    },
    {
      message: 'employeeIds/departmentIds obrigatórios conforme o escopo',
    },
  );

export const generateBulkBadgePdfsResponseSchema = z.object({
  /** Deterministic job id; null when the scope resolved to zero employees. */
  jobId: z.string().nullable(),
  total: z.number().int().nonnegative(),
});

export const downloadBulkPdfParamsSchema = z.object({
  jobId: z.string().min(1),
});
