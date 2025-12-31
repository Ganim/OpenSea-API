/**
 * TAG SCHEMAS
 */

import { z } from 'zod';

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  description: z.string().max(500).optional(),
});

export const tagResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const updateTagSchema = createTagSchema.partial();
