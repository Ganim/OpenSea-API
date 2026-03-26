/**
 * MEDICAL EXAM SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const medicalExamTypeEnum = z.enum([
  'ADMISSIONAL',
  'PERIODICO',
  'MUDANCA_FUNCAO',
  'RETORNO',
  'DEMISSIONAL',
]);

export const medicalExamResultEnum = z.enum([
  'APTO',
  'INAPTO',
  'APTO_COM_RESTRICOES',
]);

/**
 * Schema para criação de exame médico
 */
export const createMedicalExamSchema = z.object({
  employeeId: idSchema,
  type: medicalExamTypeEnum,
  examDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional(),
  doctorName: z.string().min(1).max(256),
  doctorCrm: z.string().min(1).max(32),
  result: medicalExamResultEnum,
  observations: z.string().max(2000).optional(),
  documentUrl: z.string().url().optional(),
});

/**
 * Schema para atualização de exame médico
 */
export const updateMedicalExamSchema = z.object({
  type: medicalExamTypeEnum.optional(),
  examDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  doctorName: z.string().min(1).max(256).optional(),
  doctorCrm: z.string().min(1).max(32).optional(),
  result: medicalExamResultEnum.optional(),
  observations: z.string().max(2000).optional(),
  documentUrl: z.string().url().optional(),
});

/**
 * Schema para query de listagem de exames médicos
 */
export const listMedicalExamsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  type: medicalExamTypeEnum.optional(),
  result: medicalExamResultEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema de resposta de exame médico
 */
export const medicalExamResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  type: z.string(),
  examDate: dateSchema,
  expirationDate: dateSchema.nullable(),
  doctorName: z.string(),
  doctorCrm: z.string(),
  result: z.string(),
  observations: z.string().nullable(),
  documentUrl: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
