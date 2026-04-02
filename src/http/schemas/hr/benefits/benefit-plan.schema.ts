/**
 * BENEFIT PLAN SCHEMAS
 */

import { z } from 'zod';
import {
  cuidSchema,
  dateSchema,
  queryBooleanSchema,
} from '../../common.schema';

const benefitTypeEnum = z.enum([
  'VT',
  'VR',
  'VA',
  'HEALTH',
  'DENTAL',
  'LIFE_INSURANCE',
  'DAYCARE',
  'PLR',
  'LOAN',
  'EDUCATION',
  'HOME_OFFICE',
  'FLEX',
]);

/**
 * Schema para criação de plano de benefício
 */
export const createBenefitPlanSchema = z.object({
  name: z.string().min(1).max(128),
  type: benefitTypeEnum,
  provider: z.string().max(128).optional(),
  policyNumber: z.string().max(64).optional(),
  rules: z.record(z.unknown()).optional(),
  description: z.string().max(1000).optional(),
});

/**
 * Schema para atualização de plano de benefício
 */
export const updateBenefitPlanSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  type: benefitTypeEnum.optional(),
  provider: z.string().max(128).optional(),
  policyNumber: z.string().max(64).optional(),
  isActive: z.boolean().optional(),
  rules: z.record(z.unknown()).optional(),
  description: z.string().max(1000).optional(),
});

/**
 * Schema para filtros de listagem de planos de benefício
 */
export const listBenefitPlansQuerySchema = z.object({
  type: benefitTypeEnum.optional(),
  isActive: queryBooleanSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de plano de benefício
 */
export const benefitPlanResponseSchema = z.object({
  id: cuidSchema,
  name: z.string(),
  type: z.string(),
  provider: z.string().nullable(),
  policyNumber: z.string().nullable(),
  isActive: z.boolean(),
  rules: z.record(z.unknown()).nullable(),
  description: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
