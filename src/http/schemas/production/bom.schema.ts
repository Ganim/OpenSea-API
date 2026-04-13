import { z } from 'zod';

export const createBomSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  version: z.number().int().positive().optional().default(1),
  isDefault: z.boolean().optional(),
  baseQuantity: z.number().positive().optional().default(1),
});

export const updateBomSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional().nullable(),
  isDefault: z.boolean().optional(),
  baseQuantity: z.number().positive().optional(),
  validUntil: z.coerce.date().optional().nullable(),
});

export const bomResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  version: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date().nullable(),
  status: z.string(),
  baseQuantity: z.number(),
  createdById: z.string(),
  approvedById: z.string().nullable(),
  approvedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createBomItemSchema = z.object({
  materialId: z.string().min(1),
  sequence: z.number().int().positive().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1).max(16),
  wastagePercent: z.number().nonnegative().max(100).optional().default(0),
  isOptional: z.boolean().optional(),
  substituteForId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateBomItemSchema = z.object({
  materialId: z.string().min(1).optional(),
  sequence: z.number().int().positive().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(16).optional(),
  wastagePercent: z.number().nonnegative().max(100).optional(),
  isOptional: z.boolean().optional(),
  substituteForId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const bomItemResponseSchema = z.object({
  id: z.string(),
  bomId: z.string(),
  materialId: z.string(),
  sequence: z.number(),
  quantity: z.number(),
  unit: z.string(),
  wastagePercent: z.number(),
  isOptional: z.boolean(),
  substituteForId: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
