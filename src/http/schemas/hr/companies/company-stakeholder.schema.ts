/**
 * COMPANY STAKEHOLDER SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const companyStakeholderRoleSchema = z.enum([
  'SOCIO',
  'ADMINISTRADOR',
  'PROCURADOR',
  'REPRESENTANTE_LEGAL',
  'GERENTE',
  'DIRETOR',
  'OUTRO',
]);

export const companyStakeholderStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export const companyStakeholderSourceSchema = z.enum(['CNPJ_API', 'MANUAL']);

export const createCompanyStakeholderSchema = z.object({
  name: z.string().min(1).max(256),
  role: companyStakeholderRoleSchema.optional(),
  entryDate: dateSchema.optional(),
  exitDate: dateSchema.optional(),
  personDocumentMasked: z.string().max(32).optional(),
  isLegalRepresentative: z.boolean().optional().default(false),
  source: companyStakeholderSourceSchema.optional().default('MANUAL'),
  rawPayloadRef: z.string().max(512).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateCompanyStakeholderSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  role: companyStakeholderRoleSchema.optional().nullable(),
  entryDate: dateSchema.optional().nullable(),
  exitDate: dateSchema.optional().nullable(),
  personDocumentMasked: z.string().max(32).optional().nullable(),
  isLegalRepresentative: z.boolean().optional(),
  status: companyStakeholderStatusSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const listCompanyStakeholdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  status: companyStakeholderStatusSchema.optional(),
  isLegalRepresentative: z.coerce.boolean().optional(),
  role: companyStakeholderRoleSchema.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export const companyStakeholderResponseSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  name: z.string(),
  role: companyStakeholderRoleSchema.optional().nullable(),
  entryDate: dateSchema.optional().nullable(),
  exitDate: dateSchema.optional().nullable(),
  personDocumentMasked: z.string().optional().nullable(),
  isLegalRepresentative: z.boolean(),
  status: companyStakeholderStatusSchema,
  source: companyStakeholderSourceSchema,
  rawPayloadRef: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  pendingIssues: z.array(z.string()),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

// ===============================================
