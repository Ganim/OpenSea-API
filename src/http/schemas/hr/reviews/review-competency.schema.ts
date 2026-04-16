/**
 * REVIEW COMPETENCY SCHEMAS
 *
 * Validação para endpoints de competências em avaliações de desempenho.
 * Score: 0 a 5 inclusive, em incrementos de 0.5 (validação reforçada no use case).
 */

import { z } from 'zod';
import { cuidSchema, dateSchema } from '../../common.schema';

const competencyScoreSchema = z
  .number()
  .min(0, 'O score deve ser no mínimo 0')
  .max(5, 'O score deve ser no máximo 5')
  .multipleOf(0.5, 'O score deve ser múltiplo de 0.5');

const competencyNameSchema = z
  .string()
  .min(1, 'O nome é obrigatório')
  .max(100, 'O nome deve ter no máximo 100 caracteres');

const competencyWeightSchema = z
  .number()
  .positive('O peso da competência deve ser positivo');

const competencyCommentsSchema = z
  .string()
  .max(2000, 'O comentário deve ter no máximo 2000 caracteres');

/**
 * Schema para criação de competência
 */
export const createReviewCompetencySchema = z.object({
  name: competencyNameSchema,
  weight: competencyWeightSchema.optional(),
  selfScore: competencyScoreSchema.optional(),
  managerScore: competencyScoreSchema.optional(),
  comments: competencyCommentsSchema.optional(),
});

/**
 * Schema para atualização de competência
 *
 * selfScore, managerScore e comments aceitam null para limpar o valor.
 */
export const updateReviewCompetencySchema = z.object({
  name: competencyNameSchema.optional(),
  weight: competencyWeightSchema.optional(),
  selfScore: competencyScoreSchema.nullable().optional(),
  managerScore: competencyScoreSchema.nullable().optional(),
  comments: competencyCommentsSchema.nullable().optional(),
});

/**
 * Schema de parametros de rota com reviewId
 */
export const reviewCompetencyRouteParamsSchema = z.object({
  reviewId: cuidSchema,
});

/**
 * Schema de parametros de rota com reviewId + competencyId
 */
export const reviewCompetencyItemParamsSchema = z.object({
  reviewId: cuidSchema,
  competencyId: cuidSchema,
});

/**
 * Schema da resposta de competência
 */
export const reviewCompetencyResponseSchema = z.object({
  id: cuidSchema,
  reviewId: cuidSchema,
  name: z.string(),
  selfScore: z.number().nullable(),
  managerScore: z.number().nullable(),
  weight: z.number(),
  comments: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema da resposta de listagem de competências
 */
export const listReviewCompetenciesResponseSchema = z.object({
  competencies: z.array(reviewCompetencyResponseSchema),
});

/**
 * Schema da resposta do seed-defaults
 */
export const seedDefaultReviewCompetenciesResponseSchema = z.object({
  competencies: z.array(reviewCompetencyResponseSchema),
  createdCount: z.number().int().nonnegative(),
  alreadyExistedCount: z.number().int().nonnegative(),
});
