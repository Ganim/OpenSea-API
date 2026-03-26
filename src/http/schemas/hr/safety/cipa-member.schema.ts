/**
 * CIPA MEMBER SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const cipaMemberRoleEnum = z.enum([
  'PRESIDENTE',
  'VICE_PRESIDENTE',
  'SECRETARIO',
  'MEMBRO_TITULAR',
  'MEMBRO_SUPLENTE',
]);

export const cipaMemberTypeEnum = z.enum(['EMPREGADOR', 'EMPREGADO']);

/**
 * Schema para adição de membro CIPA
 */
export const addCipaMemberSchema = z.object({
  employeeId: idSchema,
  role: cipaMemberRoleEnum,
  type: cipaMemberTypeEnum,
});

/**
 * Schema para query de listagem
 */
export const listCipaMembersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema de resposta
 */
export const cipaMemberResponseSchema = z.object({
  id: idSchema,
  mandateId: idSchema,
  employeeId: idSchema,
  role: z.string(),
  type: z.string(),
  isStable: z.boolean(),
  stableUntil: dateSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
