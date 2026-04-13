import { z } from 'zod';

export const createWorkCenterSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateWorkCenterSchema = createWorkCenterSchema.partial();

export const workCenterResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
