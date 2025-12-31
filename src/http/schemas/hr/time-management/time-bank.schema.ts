/**
 * TIME BANK SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para consulta de banco de horas
 */
export const getTimeBankQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema para crédito/débito no banco de horas
 */
export const creditDebitTimeBankSchema = z.object({
  employeeId: idSchema,
  hours: z.number().positive(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema para ajuste do banco de horas
 */
export const adjustTimeBankSchema = z.object({
  employeeId: idSchema,
  newBalance: z.number(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema para filtros de listagem de banco de horas
 */
export const listTimeBanksQuerySchema = z.object({
  employeeId: idSchema.optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema para resposta de banco de horas
 */
export const timeBankResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  balance: z.number(),
  year: z.number(),
  hasPositiveBalance: z.boolean(),
  hasNegativeBalance: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
