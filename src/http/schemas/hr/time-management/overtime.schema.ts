/**
 * OVERTIME SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para solicitação de hora extra
 */
export const requestOvertimeSchema = z.object({
  employeeId: idSchema,
  date: z.coerce.date(),
  hours: z.number().positive().max(12),
  reason: z.string().min(10).max(500),
});

/**
 * Schema para aprovação de hora extra
 */
export const approveOvertimeSchema = z.object({
  addToTimeBank: z.boolean().optional().default(false),
});

/**
 * Schema para filtros de listagem de horas extras
 */
export const listOvertimeQuerySchema = z.object({
  employeeId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  approved: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de hora extra
 */
export const overtimeResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  date: dateSchema,
  hours: z.number(),
  reason: z.string(),
  approved: z.boolean(),
  approvedBy: idSchema.optional().nullable(),
  approvedAt: dateSchema.optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
