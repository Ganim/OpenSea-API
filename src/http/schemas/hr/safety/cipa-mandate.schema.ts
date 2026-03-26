/**
 * CIPA MANDATE SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const cipaMandateStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'DRAFT']);

/**
 * Schema para criação de mandato CIPA
 */
export const createCipaMandateSchema = z.object({
  name: z.string().min(1).max(256),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: cipaMandateStatusEnum.optional(),
  electionDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para atualização de mandato CIPA
 */
export const updateCipaMandateSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: cipaMandateStatusEnum.optional(),
  electionDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para query de listagem
 */
export const listCipaMandatesQuerySchema = z.object({
  status: cipaMandateStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema de resposta
 */
export const cipaMandateResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  startDate: dateSchema,
  endDate: dateSchema,
  status: z.string(),
  electionDate: dateSchema.nullable(),
  notes: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
