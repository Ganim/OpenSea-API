import { z } from 'zod';

/**
 * Zod schemas for the bulk QR rotation HTTP surface (Plan 05-04 / D-14 bulk):
 *   - POST /v1/hr/qr-tokens/rotate-bulk
 *   - POST /v1/hr/qr-tokens/rotate-bulk/:jobId/cancel
 *
 * Named exports per ADR-017.
 */

export const rotateBulkBodySchema = z
  .object({
    scope: z.enum(['ALL', 'DEPARTMENT', 'CUSTOM']),
    employeeIds: z.array(z.string().uuid()).optional(),
    departmentIds: z.array(z.string().uuid()).optional(),
    generatePdfs: z.boolean().default(false),
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

export const rotateBulkResponseSchema = z.object({
  jobId: z.string().nullable(),
  total: z.number().int().nonnegative(),
  generatePdfs: z.boolean(),
});

export const cancelBulkParamsSchema = z.object({
  jobId: z.string().min(1),
});

export const cancelBulkResponseSchema = z.object({
  cancelled: z.literal(true),
});
