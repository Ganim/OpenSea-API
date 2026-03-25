import { z } from 'zod';

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  budgetAmount: z.number().positive(),
  notes: z.string().optional(),
});

export const updateBudgetSchema = z.object({
  budgetAmount: z.number().positive().optional(),
  notes: z.string().nullable().optional(),
});

export const listBudgetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  categoryId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
});

export const budgetIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const bulkCreateBudgetsSchema = z.object({
  categoryId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
  year: z.number().int().min(2000).max(2100),
  monthlyBudgets: z
    .array(
      z.object({
        month: z.number().int().min(1).max(12),
        budgetAmount: z.number().positive(),
      }),
    )
    .min(1)
    .max(12),
  notes: z.string().optional(),
});

export const budgetVsActualQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  costCenterId: z.string().uuid().optional(),
});

export const budgetResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  categoryId: z.string(),
  costCenterId: z.string().nullable(),
  year: z.number(),
  month: z.number(),
  budgetAmount: z.number(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});
