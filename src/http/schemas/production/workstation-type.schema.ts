import { z } from 'zod';

export const createWorkstationTypeSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  icon: z.string().max(64).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateWorkstationTypeSchema =
  createWorkstationTypeSchema.partial();

export const workstationTypeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
