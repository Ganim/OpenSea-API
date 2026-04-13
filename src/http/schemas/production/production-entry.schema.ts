import { z } from 'zod';

export const createProductionEntrySchema = z.object({
  jobCardId: z.string().min(1),
  quantityGood: z.number().min(0),
  quantityScrapped: z.number().min(0).optional(),
  quantityRework: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const productionEntryResponseSchema = z.object({
  id: z.string(),
  jobCardId: z.string(),
  operatorId: z.string(),
  quantityGood: z.number(),
  quantityScrapped: z.number(),
  quantityRework: z.number(),
  enteredAt: z.coerce.date(),
  notes: z.string().nullable(),
});
