/**
 * SHIFT SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema, queryBooleanSchema } from '../../common.schema';

/**
 * Schema para tipo de turno
 */
export const shiftTypeSchema = z.enum([
  'FIXED',
  'ROTATING',
  'FLEXIBLE',
  'ON_CALL',
]);

/**
 * Schema para formato de hora (HH:MM)
 */
const shiftTimeFormatSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM');

/**
 * Schema para criação de turno
 */
export const createShiftSchema = z.object({
  name: z.string().min(2).max(128),
  code: z.string().max(32).optional(),
  type: shiftTypeSchema,
  startTime: shiftTimeFormatSchema,
  endTime: shiftTimeFormatSchema,
  breakMinutes: z.number().int().min(0).max(480).default(60),
  isNightShift: z.boolean().optional().default(false),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional(),
});

/**
 * Schema para atualização de turno
 */
export const updateShiftSchema = createShiftSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/**
 * Schema para filtros de listagem de turnos
 */
export const listShiftsQuerySchema = z.object({
  activeOnly: queryBooleanSchema.optional().default(false),
});

/**
 * Schema para resposta de turno
 */
export const shiftResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string().nullable(),
  type: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  breakMinutes: z.number(),
  isNightShift: z.boolean(),
  color: z.string().nullable(),
  isActive: z.boolean(),
  durationHours: z.number(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para atribuição de funcionário a turno
 */
export const assignEmployeeToShiftSchema = z.object({
  employeeId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Schema para transferência de turno
 */
export const transferEmployeeShiftSchema = z.object({
  employeeId: idSchema,
  newShiftId: idSchema,
  startDate: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

/**
 * Schema para resposta de atribuição de turno
 */
export const shiftAssignmentResponseSchema = z.object({
  id: idSchema,
  shiftId: z.string(),
  employeeId: z.string(),
  startDate: dateSchema,
  endDate: dateSchema.nullable(),
  isActive: z.boolean(),
  notes: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
