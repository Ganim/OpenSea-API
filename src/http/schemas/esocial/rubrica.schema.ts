import { z } from 'zod';
import { dateSchema, idSchema, queryBooleanSchema } from '../common.schema';

/**
 * Schema para resposta de rubrica
 */
export const esocialRubricaResponseSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  code: z.string(),
  description: z.string(),
  type: z.number(),
  typeLabel: z.string(),
  incidInss: z.string().nullable(),
  incidIrrf: z.string().nullable(),
  incidFgts: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para criação de rubrica
 */
export const createRubricaSchema = z.object({
  code: z.string().min(1).max(32),
  description: z.string().min(1).max(256),
  type: z.number().int().min(1).max(3),
  incidInss: z.string().max(2).optional(),
  incidIrrf: z.string().max(2).optional(),
  incidFgts: z.string().max(2).optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema para atualização de rubrica
 */
export const updateRubricaSchema = z.object({
  description: z.string().min(1).max(256).optional(),
  type: z.number().int().min(1).max(3).optional(),
  incidInss: z.string().max(2).optional().nullable(),
  incidIrrf: z.string().max(2).optional().nullable(),
  incidFgts: z.string().max(2).optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * Schema para filtros de listagem de rubricas
 */
export const listRubricasQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  type: z.coerce.number().int().min(1).max(3).optional(),
  isActive: queryBooleanSchema.optional(),
});
