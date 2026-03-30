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

export const medicalExamAptitudeEnum = z.enum([
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
  // PCMSO fields
  examCategory: medicalExamTypeEnum.optional(),
  validityMonths: z.coerce.number().int().positive().optional(),
  clinicName: z.string().max(256).optional(),
  clinicAddress: z.string().max(512).optional(),
  physicianName: z.string().max(256).optional(),
  physicianCRM: z.string().max(32).optional(),
  aptitude: medicalExamAptitudeEnum.optional(),
  restrictions: z.string().max(2000).optional(),
  nextExamDate: z.coerce.date().optional(),
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
  // PCMSO fields
  examCategory: medicalExamTypeEnum.optional(),
  validityMonths: z.coerce.number().int().positive().optional(),
  clinicName: z.string().max(256).optional(),
  clinicAddress: z.string().max(512).optional(),
  physicianName: z.string().max(256).optional(),
  physicianCRM: z.string().max(32).optional(),
  aptitude: medicalExamAptitudeEnum.optional(),
  restrictions: z.string().max(2000).optional(),
  nextExamDate: z.coerce.date().optional(),
});

/**
 * Schema para query de listagem de exames médicos
 */
export const listMedicalExamsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  type: medicalExamTypeEnum.optional(),
  result: medicalExamResultEnum.optional(),
  aptitude: medicalExamAptitudeEnum.optional(),
  status: z.enum(['VALID', 'EXPIRING', 'EXPIRED']).optional(),
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
  // PCMSO fields
  examCategory: z.string().nullable(),
  validityMonths: z.number().nullable(),
  clinicName: z.string().nullable(),
  clinicAddress: z.string().nullable(),
  physicianName: z.string().nullable(),
  physicianCRM: z.string().nullable(),
  aptitude: z.string().nullable(),
  restrictions: z.string().nullable(),
  nextExamDate: dateSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para query de exames vencendo
 */
export const listExpiringExamsQuerySchema = z.object({
  daysThreshold: z.coerce.number().int().positive().optional().default(30),
});

/**
 * Schema para criação de requisito de exame ocupacional
 */
export const createExamRequirementSchema = z.object({
  positionId: idSchema.optional(),
  examType: z.string().min(1).max(64),
  examCategory: medicalExamTypeEnum,
  frequencyMonths: z.coerce.number().int().positive(),
  isMandatory: z.boolean().optional().default(true),
  description: z.string().max(2000).optional(),
});

/**
 * Schema para query de requisitos de exame
 */
export const listExamRequirementsQuerySchema = z.object({
  positionId: idSchema.optional(),
  examCategory: medicalExamTypeEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(50),
});

/**
 * Schema de resposta de requisito de exame ocupacional
 */
export const examRequirementResponseSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  positionId: idSchema.nullable(),
  examType: z.string(),
  examCategory: z.string(),
  frequencyMonths: z.number(),
  isMandatory: z.boolean(),
  description: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema de resposta de compliance do funcionário
 */
export const complianceItemSchema = z.object({
  requirement: examRequirementResponseSchema,
  latestExam: medicalExamResponseSchema.nullable(),
  status: z.enum(['COMPLIANT', 'EXPIRING', 'OVERDUE', 'MISSING']),
  daysUntilExpiry: z.number().nullable(),
});

export const employeeComplianceResponseSchema = z.object({
  employeeId: idSchema,
  complianceItems: z.array(complianceItemSchema),
  overallStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT']),
  totalRequirements: z.number(),
  compliantCount: z.number(),
  expiringCount: z.number(),
  overdueCount: z.number(),
  missingCount: z.number(),
});
