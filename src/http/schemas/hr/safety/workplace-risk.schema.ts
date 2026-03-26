/**
 * WORKPLACE RISK SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const workplaceRiskCategoryEnum = z.enum([
  'FISICO',
  'QUIMICO',
  'BIOLOGICO',
  'ERGONOMICO',
  'ACIDENTE',
]);

export const workplaceRiskSeverityEnum = z.enum([
  'BAIXO',
  'MEDIO',
  'ALTO',
  'CRITICO',
]);

/**
 * Schema para criação de risco ocupacional
 */
export const createWorkplaceRiskSchema = z.object({
  name: z.string().min(1).max(256),
  category: workplaceRiskCategoryEnum,
  severity: workplaceRiskSeverityEnum,
  source: z.string().max(256).optional(),
  affectedArea: z.string().max(256).optional(),
  controlMeasures: z.string().max(2000).optional(),
  epiRequired: z.string().max(2000).optional(),
});

/**
 * Schema para atualização de risco ocupacional
 */
export const updateWorkplaceRiskSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  category: workplaceRiskCategoryEnum.optional(),
  severity: workplaceRiskSeverityEnum.optional(),
  source: z.string().max(256).optional(),
  affectedArea: z.string().max(256).optional(),
  controlMeasures: z.string().max(2000).optional(),
  epiRequired: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema para query de listagem
 */
export const listWorkplaceRisksQuerySchema = z.object({
  category: workplaceRiskCategoryEnum.optional(),
  severity: workplaceRiskSeverityEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema de resposta
 */
export const workplaceRiskResponseSchema = z.object({
  id: idSchema,
  safetyProgramId: idSchema,
  name: z.string(),
  category: z.string(),
  severity: z.string(),
  source: z.string().nullable(),
  affectedArea: z.string().nullable(),
  controlMeasures: z.string().nullable(),
  epiRequired: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
