/**
 * WORK SCHEDULE SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para formato de hora (HH:MM)
 */
export const timeFormatSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM');

/**
 * Schema para criação de escala de trabalho
 */
export const createWorkScheduleSchema = z.object({
  name: z.string().min(2).max(128),
  description: z.string().max(500).optional(),
  mondayStart: timeFormatSchema.optional(),
  mondayEnd: timeFormatSchema.optional(),
  tuesdayStart: timeFormatSchema.optional(),
  tuesdayEnd: timeFormatSchema.optional(),
  wednesdayStart: timeFormatSchema.optional(),
  wednesdayEnd: timeFormatSchema.optional(),
  thursdayStart: timeFormatSchema.optional(),
  thursdayEnd: timeFormatSchema.optional(),
  fridayStart: timeFormatSchema.optional(),
  fridayEnd: timeFormatSchema.optional(),
  saturdayStart: timeFormatSchema.optional(),
  saturdayEnd: timeFormatSchema.optional(),
  sundayStart: timeFormatSchema.optional(),
  sundayEnd: timeFormatSchema.optional(),
  breakDuration: z.number().int().min(0).max(480),
});

/**
 * Schema para atualização de escala de trabalho
 */
export const updateWorkScheduleSchema = createWorkScheduleSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

/**
 * Schema para filtros de listagem de escalas
 */
export const listWorkSchedulesQuerySchema = z.object({
  activeOnly: z.coerce.boolean().optional().default(false),
});

/**
 * Schema para resposta de escala de trabalho
 */
export const workScheduleResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().optional().nullable(),
  mondayStart: z.string().optional().nullable(),
  mondayEnd: z.string().optional().nullable(),
  tuesdayStart: z.string().optional().nullable(),
  tuesdayEnd: z.string().optional().nullable(),
  wednesdayStart: z.string().optional().nullable(),
  wednesdayEnd: z.string().optional().nullable(),
  thursdayStart: z.string().optional().nullable(),
  thursdayEnd: z.string().optional().nullable(),
  fridayStart: z.string().optional().nullable(),
  fridayEnd: z.string().optional().nullable(),
  saturdayStart: z.string().optional().nullable(),
  saturdayEnd: z.string().optional().nullable(),
  sundayStart: z.string().optional().nullable(),
  sundayEnd: z.string().optional().nullable(),
  breakDuration: z.number(),
  isActive: z.boolean(),
  weeklyHours: z.number(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
