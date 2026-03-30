/**
 * Onboarding Zod Schemas
 * Schemas reutilizáveis para validação de checklists de onboarding
 */

import { z } from 'zod';
import { idSchema } from '../../common.schema';

// ── Item Schema ─────────────────────────────────────────────────────────────

export const onboardingItemInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
});

export const onboardingItemResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  completedAt: z.date().optional().nullable(),
});

// ── Create Schema ───────────────────────────────────────────────────────────

export const createOnboardingChecklistSchema = z.object({
  employeeId: idSchema,
  title: z.string().min(1).max(200).optional().default('Onboarding'),
  items: z.array(onboardingItemInputSchema).optional(),
});

// ── Update Schema ───────────────────────────────────────────────────────────

export const updateOnboardingChecklistSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  items: z.array(onboardingItemInputSchema).optional(),
});

// ── Query Schema ────────────────────────────────────────────────────────────

export const listOnboardingChecklistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  employeeId: idSchema.optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED']).optional(),
  search: z.string().optional(),
});

// ── Response Schemas ────────────────────────────────────────────────────────

export const onboardingChecklistResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  title: z.string(),
  items: z.array(onboardingItemResponseSchema),
  progress: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// paginationMetaSchema imported from employee.schema.ts to avoid barrel conflict
