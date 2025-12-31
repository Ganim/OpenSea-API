/**
 * CATEGORY SCHEMAS
 */

import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1).max(128),
  slug: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional(),
  parentId: z.uuid().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const categoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  parentId: z.uuid().nullable().optional(),
  displayOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateCategorySchema = categorySchema.partial();
