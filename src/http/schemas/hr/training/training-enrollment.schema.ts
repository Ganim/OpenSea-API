/**
 * TRAINING ENROLLMENT SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para inscrição de funcionário em treinamento
 */
export const enrollEmployeeInTrainingSchema = z.object({
  trainingProgramId: idSchema,
  employeeId: idSchema,
  notes: z.string().max(1000).optional(),
});

/**
 * Schema para conclusão de treinamento
 */
export const completeTrainingEnrollmentSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  certificateUrl: z.string().url().max(500).optional(),
});

/**
 * Schema para filtros de listagem de inscrições em treinamento
 */
export const listTrainingEnrollmentsQuerySchema = z.object({
  trainingProgramId: idSchema.optional(),
  employeeId: idSchema.optional(),
  status: z
    .enum(['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'])
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de inscrição em treinamento
 */
export const trainingEnrollmentResponseSchema = z.object({
  id: idSchema,
  trainingProgramId: idSchema,
  employeeId: idSchema,
  status: z.string(),
  enrolledAt: dateSchema,
  startedAt: dateSchema.nullable(),
  completedAt: dateSchema.nullable(),
  score: z.number().nullable(),
  certificateUrl: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
