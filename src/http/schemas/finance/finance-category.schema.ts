import { z } from 'zod';

export const createFinanceCategorySchema = z.object({
  name: z.string().min(1).max(128),
  slug: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional(),
  iconUrl: z.string().url().max(512).optional(),
  color: z.string().max(7).optional(),
  type: z.enum(['EXPENSE', 'REVENUE', 'BOTH']),
  parentId: z.string().uuid().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const financeCategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional().nullable(),
  iconUrl: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  type: z.string(),
  parentId: z.string().uuid().optional().nullable(),
  displayOrder: z.number(),
  isActive: z.boolean(),
  isSystem: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const updateFinanceCategorySchema = createFinanceCategorySchema.partial();
