/**
 * TIME CONTROL SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Tipo de registro de ponto
 */
export const timeEntryTypeSchema = z.enum([
  'CLOCK_IN',
  'CLOCK_OUT',
  'BREAK_START',
  'BREAK_END',
  'OVERTIME_START',
  'OVERTIME_END',
]);

/**
 * Schema para registro de ponto (clock in/out)
 */
export const clockInOutSchema = z.object({
  employeeId: idSchema,
  timestamp: z.coerce.date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ipAddress: z.string().max(64).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Schema para filtros de listagem de registros de ponto
 */
export const listTimeEntriesQuerySchema = z.object({
  employeeId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  entryType: timeEntryTypeSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(50),
});

/**
 * Schema para cálculo de horas trabalhadas
 */
export const calculateWorkedHoursSchema = z.object({
  employeeId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

/**
 * Schema para resposta de registro de ponto
 */
export const timeEntryResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  entryType: z.string(),
  timestamp: dateSchema,
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: dateSchema,
});

/**
 * Schema para resposta de horas diárias
 */
export const dailyHoursResponseSchema = z.object({
  date: dateSchema,
  workedHours: z.number(),
  breakHours: z.number(),
  overtimeHours: z.number(),
  totalHours: z.number(),
});

/**
 * Schema para resposta de cálculo de horas
 */
export const workedHoursResponseSchema = z.object({
  employeeId: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  dailyBreakdown: z.array(dailyHoursResponseSchema),
  totalWorkedHours: z.number(),
  totalBreakHours: z.number(),
  totalOvertimeHours: z.number(),
  totalNetHours: z.number(),
});

// ===============================================
