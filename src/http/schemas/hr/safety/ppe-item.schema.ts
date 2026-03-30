/**
 * PPE ITEM SCHEMAS (EPI - Equipamentos de Proteção Individual)
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const ppeCategoryEnum = z.enum([
  'HEAD',
  'EYES',
  'EARS',
  'RESPIRATORY',
  'HANDS',
  'FEET',
  'BODY',
  'FALL_PROTECTION',
]);

/**
 * Schema para criação de item EPI
 */
export const createPPEItemSchema = z.object({
  name: z.string().min(1).max(256),
  category: ppeCategoryEnum,
  caNumber: z.string().max(64).optional(),
  manufacturer: z.string().max(256).optional(),
  model: z.string().max(256).optional(),
  expirationMonths: z.coerce.number().int().positive().optional(),
  minStock: z.coerce.number().int().min(0).optional().default(0),
  currentStock: z.coerce.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para atualização de item EPI
 */
export const updatePPEItemSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  category: ppeCategoryEnum.optional(),
  caNumber: z.string().max(64).nullable().optional(),
  manufacturer: z.string().max(256).nullable().optional(),
  model: z.string().max(256).nullable().optional(),
  expirationMonths: z.coerce.number().int().positive().nullable().optional(),
  minStock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

/**
 * Schema para ajuste de estoque
 */
export const adjustPPEItemStockSchema = z.object({
  adjustment: z.coerce.number().int().refine((val) => val !== 0, {
    message: 'Adjustment cannot be zero',
  }),
});

/**
 * Schema para query de listagem de itens EPI
 */
export const listPPEItemsQuerySchema = z.object({
  category: ppeCategoryEnum.optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  lowStockOnly: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema de resposta de item EPI
 */
export const ppeItemResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  category: z.string(),
  caNumber: z.string().nullable(),
  manufacturer: z.string().nullable(),
  model: z.string().nullable(),
  expirationMonths: z.number().nullable(),
  minStock: z.number(),
  currentStock: z.number(),
  isActive: z.boolean(),
  isLowStock: z.boolean(),
  notes: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
