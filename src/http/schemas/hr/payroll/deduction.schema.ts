/**
 * DEDUCTION SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para criação de dedução
 */
export const createDeductionSchema = z.object({
  employeeId: idSchema,
  name: z.string().min(1).max(128),
  amount: z.number().positive(),
  reason: z.string().min(10).max(1000),
  date: z.coerce.date(),
  isRecurring: z.boolean().optional().default(false),
  installments: z.number().int().positive().optional(),
});

/**
 * Schema para filtros de listagem de deduções
 */
export const listDeductionsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  isApplied: z.coerce.boolean().optional(),
  isRecurring: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de dedução
 */
export const deductionResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  name: z.string(),
  amount: z.number(),
  reason: z.string(),
  date: dateSchema,
  isRecurring: z.boolean(),
  installments: z.number().optional().nullable(),
  currentInstallment: z.number().nullable(),
  isApplied: z.boolean(),
  appliedAt: dateSchema.optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
// ===============================================
