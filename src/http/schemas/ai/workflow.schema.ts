import { z } from 'zod';

// --- Request schemas ---

export const createWorkflowBodySchema = z.object({
  naturalPrompt: z
    .string()
    .min(10, 'Descreva o workflow com pelo menos 10 caracteres')
    .max(4000),
});

export const listWorkflowsQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  triggerType: z.enum(['MANUAL', 'CRON', 'EVENT']).optional(),
  search: z.string().max(256).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const workflowIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateWorkflowBodySchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(4000).optional(),
  triggerType: z.enum(['MANUAL', 'CRON', 'EVENT']).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  conditions: z.array(z.unknown()).nullable().optional(),
  actions: z.array(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const listExecutionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// --- Response schemas ---

export const workflowResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  naturalPrompt: z.string().optional(),
  triggerType: z.string(),
  triggerConfig: z.any().nullable().optional(),
  conditions: z.any().nullable().optional(),
  actions: z.any(),
  isActive: z.boolean(),
  lastRunAt: z.date().nullable().optional(),
  runCount: z.number().optional(),
  lastError: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date().nullable().optional(),
});

export const workflowDetailResponseSchema = workflowResponseSchema.extend({
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  recentExecutions: z
    .array(
      z.object({
        id: z.string(),
        status: z.string(),
        trigger: z.string(),
        error: z.string().nullable(),
        startedAt: z.date(),
        completedAt: z.date().nullable(),
      }),
    )
    .optional(),
});

export const executionResponseSchema = z.object({
  id: z.string(),
  workflowId: z.string().optional(),
  status: z.string(),
  trigger: z.string(),
  results: z.any().nullable().optional(),
  error: z.string().nullable().optional(),
  startedAt: z.date(),
  completedAt: z.date().nullable(),
});

export const paginatedMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
});
