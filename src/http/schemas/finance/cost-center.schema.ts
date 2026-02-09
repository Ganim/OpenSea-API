import { z } from 'zod';

export const createCostCenterSchema = z.object({
  companyId: z.string().uuid().optional(),
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  monthlyBudget: z.number().min(0).optional(),
  annualBudget: z.number().min(0).optional(),
  parentId: z.string().uuid().optional(),
});

export const costCenterResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid().optional().nullable(),
  code: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  isActive: z.boolean(),
  monthlyBudget: z.number().optional().nullable(),
  annualBudget: z.number().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const updateCostCenterSchema = createCostCenterSchema.partial();
