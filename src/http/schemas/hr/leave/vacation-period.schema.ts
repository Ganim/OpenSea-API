/**
 * VACATION PERIOD SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Status de período de férias
 */
export const vacationStatusSchema = z.enum([
  'PENDING',
  'AVAILABLE',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
  'SOLD',
]);

/**
 * Schema para criação de período de férias
 */
export const createVacationPeriodSchema = z.object({
  employeeId: idSchema,
  acquisitionStart: z.coerce.date(),
  acquisitionEnd: z.coerce.date(),
  concessionStart: z.coerce.date(),
  concessionEnd: z.coerce.date(),
  totalDays: z.number().int().positive().default(30),
  notes: z.string().max(500).optional(),
});

/**
 * Schema para agendamento de férias
 */
export const scheduleVacationSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  days: z.number().int().positive().min(5).max(30),
});

/**
 * Schema para venda de férias (abono pecuniário)
 */
export const sellVacationDaysSchema = z.object({
  daysToSell: z.number().int().positive().max(10),
});

/**
 * Schema para conclusão de férias
 */
export const completeVacationSchema = z.object({
  daysUsed: z.number().int().positive(),
});

/**
 * Schema para filtros de listagem de períodos de férias
 */
export const listVacationPeriodsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  status: vacationStatusSchema.optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de período de férias
 */
export const vacationPeriodResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  acquisitionStart: dateSchema,
  acquisitionEnd: dateSchema,
  concessionStart: dateSchema,
  concessionEnd: dateSchema,
  totalDays: z.number(),
  usedDays: z.number(),
  soldDays: z.number(),
  remainingDays: z.number(),
  status: z.string(),
  scheduledStart: dateSchema.optional().nullable(),
  scheduledEnd: dateSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para resposta de saldo de férias
 */
export const vacationBalanceResponseSchema = z.object({
  employeeId: idSchema,
  employeeName: z.string(),
  totalAvailableDays: z.number(),
  totalUsedDays: z.number(),
  totalSoldDays: z.number(),
  periods: z.array(
    z.object({
      acquisitionPeriod: z.string(),
      concessionDeadline: dateSchema,
      totalDays: z.number(),
      usedDays: z.number(),
      soldDays: z.number(),
      remainingDays: z.number(),
      status: z.string(),
      isExpired: z.boolean(),
      daysUntilExpiration: z.number(),
    }),
  ),
});

// ===============================================
