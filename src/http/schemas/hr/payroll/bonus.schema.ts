/**
 * BONUS SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para criação de bônus
 */
export const createBonusSchema = z.object({
  employeeId: idSchema,
  name: z.string().min(1).max(128),
  amount: z.number().positive(),
  reason: z.string().min(10).max(1000),
  date: z.coerce.date(),
});

/**
 * Schema para filtros de listagem de bônus
 */
export const listBonusesQuerySchema = z.object({
  employeeId: idSchema.optional(),
  isPaid: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de bônus
 */
export const bonusResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  name: z.string(),
  amount: z.number(),
  reason: z.string(),
  date: dateSchema,
  isPaid: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
