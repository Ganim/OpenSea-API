/**
 * EMPLOYEE WARNING SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Tipos de advertência
 */
export const warningTypeSchema = z.enum([
  'VERBAL',
  'WRITTEN',
  'SUSPENSION',
  'TERMINATION_WARNING',
]);

/**
 * Gravidade da advertência
 */
export const warningSeveritySchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

/**
 * Status da advertência
 */
export const warningStatusSchema = z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']);

/**
 * Schema para criação de advertência
 */
export const createWarningSchema = z.object({
  employeeId: idSchema,
  issuedBy: idSchema,
  type: warningTypeSchema,
  severity: warningSeveritySchema,
  reason: z.string().min(10).max(2000),
  description: z.string().max(5000).optional(),
  incidentDate: z.coerce.date(),
  witnessName: z.string().max(256).optional(),
  suspensionDays: z.coerce.number().int().min(1).max(30).optional(),
  attachmentUrl: z.string().max(512).optional(),
});

/**
 * Schema para atualização de advertência
 */
export const updateWarningSchema = z.object({
  type: warningTypeSchema.optional(),
  severity: warningSeveritySchema.optional(),
  reason: z.string().min(10).max(2000).optional(),
  description: z.string().max(5000).optional().nullable(),
  incidentDate: z.coerce.date().optional(),
  witnessName: z.string().max(256).optional().nullable(),
  suspensionDays: z.coerce.number().int().min(1).max(30).optional().nullable(),
  attachmentUrl: z.string().max(512).optional().nullable(),
});

/**
 * Schema para revogação de advertência
 */
export const revokeWarningSchema = z.object({
  revokeReason: z.string().min(10).max(2000),
});

/**
 * Schema para filtros de listagem de advertências
 */
export const listWarningsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  type: warningTypeSchema.optional(),
  severity: warningSeveritySchema.optional(),
  status: warningStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de advertência
 */
export const warningResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  issuedBy: idSchema,
  type: z.string(),
  severity: z.string(),
  status: z.string(),
  reason: z.string(),
  description: z.string().optional().nullable(),
  incidentDate: dateSchema,
  witnessName: z.string().optional().nullable(),
  employeeAcknowledged: z.boolean(),
  acknowledgedAt: dateSchema.optional().nullable(),
  suspensionDays: z.number().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
  revokedAt: dateSchema.optional().nullable(),
  revokeReason: z.string().optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para paginação
 */
export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});
