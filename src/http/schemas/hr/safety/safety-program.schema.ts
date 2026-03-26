/**
 * SAFETY PROGRAM SCHEMAS (PCMSO/PGR)
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const safetyProgramTypeEnum = z.enum(['PCMSO', 'PGR', 'LTCAT', 'PPRA']);

export const safetyProgramStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'DRAFT']);

/**
 * Schema para criação de programa de segurança
 */
export const createSafetyProgramSchema = z.object({
  type: safetyProgramTypeEnum,
  name: z.string().min(1).max(256),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  responsibleName: z.string().min(1).max(256),
  responsibleRegistration: z.string().min(1).max(64),
  documentUrl: z.string().url().optional(),
  status: safetyProgramStatusEnum.optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para atualização de programa de segurança
 */
export const updateSafetyProgramSchema = z.object({
  type: safetyProgramTypeEnum.optional(),
  name: z.string().min(1).max(256).optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  responsibleName: z.string().min(1).max(256).optional(),
  responsibleRegistration: z.string().min(1).max(64).optional(),
  documentUrl: z.string().url().optional(),
  status: safetyProgramStatusEnum.optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para query de listagem
 */
export const listSafetyProgramsQuerySchema = z.object({
  type: safetyProgramTypeEnum.optional(),
  status: safetyProgramStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema de resposta
 */
export const safetyProgramResponseSchema = z.object({
  id: idSchema,
  type: z.string(),
  name: z.string(),
  validFrom: dateSchema,
  validUntil: dateSchema,
  responsibleName: z.string(),
  responsibleRegistration: z.string(),
  documentUrl: z.string().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
