import { z } from 'zod';

// ============================================================================
// Inspection Results
// ============================================================================

export const createInspectionResultSchema = z.object({
  inspectionPlanId: z.string().cuid(),
  productionOrderId: z.string().cuid(),
  sampleSize: z.number().int().min(1),
  defectsFound: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional(),
});

export const updateInspectionResultStatusSchema = z.object({
  status: z.enum(['PENDING', 'PASSED', 'FAILED', 'CONDITIONAL']),
  defectsFound: z.number().int().min(0).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export const inspectionResultResponseSchema = z.object({
  id: z.string(),
  inspectionPlanId: z.string(),
  productionOrderId: z.string(),
  inspectedById: z.string(),
  inspectedAt: z.coerce.date(),
  sampleSize: z.number(),
  defectsFound: z.number(),
  status: z.string(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
});
