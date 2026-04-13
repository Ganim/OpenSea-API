import { z } from 'zod';

export const createDefectTypeSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
  isActive: z.boolean().optional(),
});

export const updateDefectTypeSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional().nullable(),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']).optional(),
  isActive: z.boolean().optional(),
});

export const defectTypeResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  severity: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
