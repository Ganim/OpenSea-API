import { z } from 'zod';

export const createMaterialReturnSchema = z.object({
  productionOrderId: z.string().min(1),
  materialId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export const materialReturnResponseSchema = z.object({
  id: z.string(),
  productionOrderId: z.string(),
  materialId: z.string(),
  warehouseId: z.string(),
  quantity: z.number(),
  reason: z.string().nullable(),
  returnedById: z.string(),
  returnedAt: z.coerce.date(),
});
