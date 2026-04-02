/**
 * TRAINING PROGRAM SCHEMAS
 */

import { z } from 'zod';
import {
  cuidSchema,
  dateSchema,
  queryBooleanSchema,
} from '../../common.schema';

const trainingCategoryEnum = z.enum([
  'ONBOARDING',
  'SAFETY',
  'TECHNICAL',
  'COMPLIANCE',
  'LEADERSHIP',
  'SOFT_SKILLS',
]);

const trainingFormatEnum = z.enum(['PRESENCIAL', 'ONLINE', 'HIBRIDO']);

/**
 * Schema para criação de programa de treinamento
 */
export const createTrainingProgramSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(1000).optional(),
  category: trainingCategoryEnum,
  format: trainingFormatEnum,
  durationHours: z.number().int().positive(),
  instructor: z.string().max(128).optional(),
  maxParticipants: z.number().int().positive().optional(),
  isMandatory: z.boolean().optional().default(false),
  validityMonths: z.number().int().positive().optional(),
});

/**
 * Schema para atualização de programa de treinamento
 */
export const updateTrainingProgramSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(1000).optional(),
  category: trainingCategoryEnum.optional(),
  format: trainingFormatEnum.optional(),
  durationHours: z.number().int().positive().optional(),
  instructor: z.string().max(128).optional(),
  maxParticipants: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  isMandatory: z.boolean().optional(),
  validityMonths: z.number().int().positive().optional(),
});

/**
 * Schema para filtros de listagem de programas de treinamento
 */
export const listTrainingProgramsQuerySchema = z.object({
  category: trainingCategoryEnum.optional(),
  format: trainingFormatEnum.optional(),
  isActive: queryBooleanSchema.optional(),
  isMandatory: queryBooleanSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de programa de treinamento
 */
export const trainingProgramResponseSchema = z.object({
  id: cuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  format: z.string(),
  durationHours: z.number(),
  instructor: z.string().nullable(),
  maxParticipants: z.number().nullable(),
  isActive: z.boolean(),
  isMandatory: z.boolean(),
  validityMonths: z.number().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
