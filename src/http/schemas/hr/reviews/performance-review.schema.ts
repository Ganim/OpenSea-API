/**
 * PERFORMANCE REVIEW SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

const performanceReviewStatusEnum = z.enum([
  'PENDING',
  'SELF_ASSESSMENT',
  'MANAGER_REVIEW',
  'COMPLETED',
]);

/**
 * Schema para criação em lote de avaliações de desempenho
 */
export const createBulkReviewsSchema = z.object({
  reviewCycleId: idSchema,
  assignments: z
    .array(
      z.object({
        employeeId: idSchema,
        reviewerId: idSchema,
      }),
    )
    .min(1),
});

/**
 * Schema para submissão de autoavaliação
 */
export const submitSelfAssessmentSchema = z.object({
  selfScore: z.number().min(1).max(5),
  selfComments: z.string().max(2000).optional(),
  strengths: z.string().max(2000).optional(),
  improvements: z.string().max(2000).optional(),
  goals: z.string().max(2000).optional(),
});

/**
 * Schema para submissão de avaliação do gestor
 */
export const submitManagerReviewSchema = z.object({
  managerScore: z.number().min(1).max(5),
  managerComments: z.string().max(2000).optional(),
  strengths: z.string().max(2000).optional(),
  improvements: z.string().max(2000).optional(),
  goals: z.string().max(2000).optional(),
});

/**
 * Schema para filtros de listagem de avaliações de desempenho
 */
export const listPerformanceReviewsQuerySchema = z.object({
  reviewCycleId: idSchema.optional(),
  employeeId: idSchema.optional(),
  reviewerId: idSchema.optional(),
  status: performanceReviewStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de avaliação de desempenho
 */
export const performanceReviewResponseSchema = z.object({
  id: idSchema,
  reviewCycleId: idSchema,
  employeeId: idSchema,
  reviewerId: idSchema,
  status: z.string(),
  selfScore: z.number().nullable(),
  managerScore: z.number().nullable(),
  finalScore: z.number().nullable(),
  selfComments: z.string().nullable(),
  managerComments: z.string().nullable(),
  strengths: z.string().nullable(),
  improvements: z.string().nullable(),
  goals: z.string().nullable(),
  employeeAcknowledged: z.boolean(),
  acknowledgedAt: dateSchema.nullable(),
  completedAt: dateSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
