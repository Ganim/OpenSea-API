/**
 * REVIEW CYCLE SCHEMAS
 */

import { z } from 'zod';
import {
  cuidSchema,
  dateSchema,
  queryBooleanSchema,
} from '../../common.schema';

const reviewCycleTypeEnum = z.enum([
  'ANNUAL',
  'SEMI_ANNUAL',
  'QUARTERLY',
  'PROBATION',
  'CUSTOM',
]);

const reviewCycleStatusEnum = z.enum([
  'DRAFT',
  'OPEN',
  'IN_REVIEW',
  'CALIBRATION',
  'CLOSED',
]);

/**
 * Schema para criação de ciclo de avaliação
 */
export const createReviewCycleSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(1000).optional(),
  type: reviewCycleTypeEnum,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

/**
 * Schema para atualização de ciclo de avaliação
 */
export const updateReviewCycleSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(1000).optional(),
  type: reviewCycleTypeEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: reviewCycleStatusEnum.optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema para filtros de listagem de ciclos de avaliação
 */
export const listReviewCyclesQuerySchema = z.object({
  type: reviewCycleTypeEnum.optional(),
  status: reviewCycleStatusEnum.optional(),
  isActive: queryBooleanSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de ciclo de avaliação
 */
export const reviewCycleResponseSchema = z.object({
  id: cuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  startDate: dateSchema,
  endDate: dateSchema,
  status: z.string(),
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
