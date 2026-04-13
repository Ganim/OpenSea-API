import { z } from 'zod';

// ============================================================================
// Production Cost
// ============================================================================

export const costTypeEnum = z.enum(['MATERIAL', 'LABOR', 'OVERHEAD']);

export const createProductionCostSchema = z.object({
  costType: costTypeEnum,
  description: z.string().max(256).optional(),
  plannedAmount: z.number().min(0),
  actualAmount: z.number().min(0),
});

export const updateProductionCostSchema = z.object({
  costType: costTypeEnum.optional(),
  description: z.string().max(256).optional().nullable(),
  plannedAmount: z.number().min(0).optional(),
  actualAmount: z.number().min(0).optional(),
});

export const productionCostResponseSchema = z.object({
  id: z.string(),
  productionOrderId: z.string(),
  costType: z.string(),
  description: z.string().nullable(),
  plannedAmount: z.number(),
  actualAmount: z.number(),
  varianceAmount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const productionCostSummarySchema = z.object({
  totalPlanned: z.number(),
  totalActual: z.number(),
  totalVariance: z.number(),
  details: z.array(productionCostResponseSchema),
});
