import { z } from 'zod';

export const createProductCareInstructionSchema = z.object({
  careInstructionId: z.string().min(1),
  order: z.number().int().min(0).optional().default(0),
});

export const productCareInstructionResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  careInstructionId: z.string(),
  order: z.number(),
  createdAt: z.coerce.date(),
});
