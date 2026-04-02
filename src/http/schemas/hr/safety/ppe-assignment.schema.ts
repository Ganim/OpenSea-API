/**
 * PPE ASSIGNMENT SCHEMAS (Atribuição de EPI)
 */

import { z } from 'zod';
import { cuidSchema, dateSchema, idSchema } from '../../common.schema';

export const ppeConditionEnum = z.enum(['NEW', 'GOOD', 'WORN', 'DAMAGED']);

export const ppeAssignmentStatusEnum = z.enum([
  'ACTIVE',
  'RETURNED',
  'EXPIRED',
  'LOST',
]);

/**
 * Schema para atribuição de EPI a funcionário
 */
export const assignPPESchema = z.object({
  ppeItemId: cuidSchema,
  employeeId: idSchema,
  expiresAt: z.coerce.date().optional(),
  condition: ppeConditionEnum.optional().default('NEW'),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para devolução de EPI
 */
export const returnPPESchema = z.object({
  returnCondition: ppeConditionEnum,
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para query de listagem de atribuições
 */
export const listPPEAssignmentsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  ppeItemId: cuidSchema.optional(),
  status: ppeAssignmentStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para query de atribuições expirando
 */
export const listExpiringAssignmentsQuerySchema = z.object({
  daysAhead: z.coerce.number().int().positive().optional().default(30),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema de resposta de atribuição de EPI
 */
export const ppeAssignmentResponseSchema = z.object({
  id: cuidSchema,
  ppeItemId: z.string(),
  employeeId: z.string(),
  assignedAt: dateSchema,
  returnedAt: dateSchema.nullable(),
  expiresAt: dateSchema.nullable(),
  condition: z.string(),
  returnCondition: z.string().nullable(),
  quantity: z.number(),
  notes: z.string().nullable(),
  status: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
