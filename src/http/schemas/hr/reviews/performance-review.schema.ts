/**
 * PERFORMANCE REVIEW SCHEMAS
 */

import { z } from 'zod';
import { cuidSchema, dateSchema, idSchema } from '../../common.schema';

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
  reviewCycleId: cuidSchema,
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
 * Schema para avanço de status da avaliação (PENDING → SELF_ASSESSMENT →
 * MANAGER_REVIEW → COMPLETED). STRICT: rejeita qualquer campo no body, em
 * especial `selfScore`/`managerScore` que historicamente eram backfilled
 * com `0` pela UI e zeravam avaliações já preenchidas (regressão P0).
 */
export const advanceReviewStatusSchema = z.object({}).strict();

/**
 * Schema para filtros de listagem de avaliações de desempenho
 */
export const listPerformanceReviewsQuerySchema = z.object({
  reviewCycleId: cuidSchema.optional(),
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
  id: cuidSchema,
  reviewCycleId: cuidSchema,
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

/**
 * Schema para resposta de avaliação de desempenho com agregados de competências.
 * Estende a resposta padrão adicionando os scores agregados (média ponderada).
 */
export const performanceReviewWithAggregatesResponseSchema =
  performanceReviewResponseSchema.extend({
    aggregatedSelfScore: z.number().nullable(),
    aggregatedManagerScore: z.number().nullable(),
  });
