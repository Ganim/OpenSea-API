import { z } from 'zod';

export const createMaterialIssueSchema = z.object({
  productionOrderId: z.string().min(1),
  materialId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().positive(),
  batchNumber: z.string().max(64).optional(),
  notes: z.string().max(500).optional(),
});

export const materialIssueResponseSchema = z.object({
  id: z.string(),
  productionOrderId: z.string(),
  materialId: z.string(),
  warehouseId: z.string(),
  quantity: z.number(),
  batchNumber: z.string().nullable(),
  issuedById: z.string(),
  issuedAt: z.coerce.date(),
  notes: z.string().nullable(),
});
