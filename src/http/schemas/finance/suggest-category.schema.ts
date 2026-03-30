import { z } from 'zod';

export const suggestCategoryQuerySchema = z
  .object({
    supplierName: z.string().max(256).optional(),
    description: z.string().max(512).optional(),
  })
  .refine((data) => data.supplierName || data.description, {
    message: 'Ao menos um parâmetro é obrigatório: supplierName ou description',
  });

export const categorySuggestionSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  confidence: z.number().min(0).max(100),
  reason: z.string(),
});

export const suggestCategoryResponseSchema = z.object({
  suggestions: z.array(categorySuggestionSchema),
});
