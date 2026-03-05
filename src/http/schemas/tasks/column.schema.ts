import { z } from 'zod';

export const createColumnSchema = z.object({
  title: z.string().min(1).max(256),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
  isDone: z.boolean().optional().default(false),
  wipLimit: z.number().int().min(0).optional().nullable(),
});

export const updateColumnSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
  isDone: z.boolean().optional(),
  wipLimit: z.number().int().min(0).optional().nullable(),
});

export const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid()).min(1),
});
