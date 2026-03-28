/**
 * Offboarding Zod Schemas
 * Schemas reutilizáveis para validação de checklists de offboarding
 */

import { z } from 'zod';
import { idSchema } from '../../common.schema';

// ── Item Schema ─────────────────────────────────────────────────────────────

export const offboardingItemInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
});

export const offboardingItemResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  completedAt: z.date().optional().nullable(),
});

// ── Create Schema ───────────────────────────────────────────────────────────

export const createOffboardingChecklistSchema = z.object({
  employeeId: idSchema,
  terminationId: idSchema.optional(),
  title: z
    .string()
    .min(1)
    .max(200)
    .optional()
    .default('Checklist de Desligamento'),
  items: z.array(offboardingItemInputSchema).optional(),
});

// ── Update Schema ───────────────────────────────────────────────────────────

export const updateOffboardingChecklistSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  items: z.array(offboardingItemInputSchema).optional(),
});

// ── Query Schema ────────────────────────────────────────────────────────────

export const listOffboardingChecklistsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  employeeId: idSchema.optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED']).optional(),
  search: z.string().optional(),
});

// ── Response Schemas ────────────────────────────────────────────────────────

export const offboardingChecklistResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  terminationId: z.string().nullable(),
  title: z.string(),
  items: z.array(offboardingItemResponseSchema),
  progress: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const offboardingPaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});
