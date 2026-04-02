/**
 * BENEFIT ENROLLMENT SCHEMAS
 */

import { z } from 'zod';
import { cuidSchema, dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para inscrição de funcionário em benefício
 */
export const enrollEmployeeSchema = z.object({
  employeeId: idSchema,
  benefitPlanId: cuidSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  employeeContribution: z.number().nonnegative().optional().default(0),
  employerContribution: z.number().nonnegative().optional().default(0),
  dependantIds: z.array(idSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schema para inscrição em massa
 */
export const bulkEnrollSchema = z.object({
  benefitPlanId: cuidSchema,
  employeeIds: z.array(idSchema).min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  employeeContribution: z.number().nonnegative().optional().default(0),
  employerContribution: z.number().nonnegative().optional().default(0),
});

/**
 * Schema para atualização de inscrição
 */
export const updateEnrollmentSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  employeeContribution: z.number().nonnegative().optional(),
  employerContribution: z.number().nonnegative().optional(),
  dependantIds: z.array(idSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Schema para filtros de listagem de inscrições
 */
export const listEnrollmentsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  benefitPlanId: cuidSchema.optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de inscrição de benefício
 */
export const benefitEnrollmentResponseSchema = z.object({
  id: cuidSchema,
  employeeId: idSchema,
  benefitPlanId: cuidSchema,
  startDate: dateSchema,
  endDate: dateSchema.nullable(),
  status: z.string(),
  employeeContribution: z.number(),
  employerContribution: z.number(),
  dependantIds: z.array(z.string()).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
