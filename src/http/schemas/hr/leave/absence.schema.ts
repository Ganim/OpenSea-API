/**
 * ABSENCE SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Tipos de ausência
 */
export const absenceTypeSchema = z.enum([
  'VACATION',
  'SICK_LEAVE',
  'PERSONAL_LEAVE',
  'MATERNITY_LEAVE',
  'PATERNITY_LEAVE',
  'BEREAVEMENT_LEAVE',
  'WEDDING_LEAVE',
  'MEDICAL_APPOINTMENT',
  'JURY_DUTY',
  'UNPAID_LEAVE',
  'OTHER',
]);

/**
 * Status de ausência
 */
export const absenceStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'IN_PROGRESS',
  'COMPLETED',
]);

/**
 * Schema para solicitação de férias
 */
export const requestVacationSchema = z.object({
  employeeId: idSchema,
  vacationPeriodId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().max(500).optional(),
});

/**
 * Schema para solicitação de atestado médico
 */
export const requestSickLeaveSchema = z.object({
  employeeId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  cid: z.string().min(1).max(10),
  documentUrl: z.string().url().optional(),
  reason: z.string().min(10).max(500),
});

/**
 * Schema para aprovação de ausência
 */
export const approveAbsenceSchema = z.object({});

/**
 * Schema para rejeição de ausência
 */
export const rejectAbsenceSchema = z.object({
  reason: z.string().min(10).max(500),
});

/**
 * Schema para filtros de listagem de ausências
 */
export const listAbsencesQuerySchema = z.object({
  employeeId: idSchema.optional(),
  type: absenceTypeSchema.optional(),
  status: absenceStatusSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de ausência
 */
export const absenceResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  type: z.string(),
  status: z.string(),
  startDate: dateSchema,
  endDate: dateSchema,
  totalDays: z.number(),
  reason: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  cid: z.string().optional().nullable(),
  isPaid: z.boolean(),
  requestedBy: idSchema.optional().nullable(),
  approvedBy: idSchema.optional().nullable(),
  approvedAt: dateSchema.optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
