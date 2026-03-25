import { z } from 'zod';

export const setupWizardBodySchema = z.object({
  businessDescription: z
    .string()
    .min(10, 'A descrição do negócio deve ter pelo menos 10 caracteres')
    .max(2000, 'A descrição do negócio deve ter no máximo 2000 caracteres'),
  industry: z.string().max(100).optional(),
  employeeCount: z.number().int().positive().max(100000).optional(),
  locationCount: z.number().int().positive().max(10000).optional(),
});

export const setupPlanItemSchema = z.object({
  order: z.number(),
  module: z.string(),
  action: z.string(),
  description: z.string(),
  args: z.record(z.string(), z.unknown()),
});

export const setupExecutionResultSchema = z.object({
  planItemOrder: z.number(),
  toolName: z.string(),
  success: z.boolean(),
  entityId: z.string().optional(),
  entityName: z.string().optional(),
  error: z.string().optional(),
});

export const setupWizardResponseSchema = z.object({
  success: z.boolean(),
  plan: z.array(setupPlanItemSchema),
  executed: z.array(setupExecutionResultSchema),
  summary: z.string(),
});
