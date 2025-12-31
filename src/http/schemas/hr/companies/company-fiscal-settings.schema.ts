/**
 * COMPANY FISCAL SETTINGS SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const nfeEnvironmentSchema = z.enum(['HOMOLOGATION', 'PRODUCTION']);
export const digitalCertificateTypeSchema = z.enum(['NONE', 'A1', 'A3']);

export const createCompanyFiscalSettingsSchema = z.object({
  nfeEnvironment: nfeEnvironmentSchema.optional(),
  nfeSeries: z.string().max(16).optional(),
  nfeLastNumber: z.number().int().min(0).optional(),
  nfeDefaultOperationNature: z.string().max(256).optional(),
  nfeDefaultCfop: z.string().max(8).optional(),
  digitalCertificateType: digitalCertificateTypeSchema
    .optional()
    .default('NONE'),
  certificateA1ExpiresAt: dateSchema.optional(),
  nfceEnabled: z.boolean().optional().default(false),
  nfceCscId: z.string().max(64).optional(),
  defaultTaxProfileId: idSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateCompanyFiscalSettingsSchema =
  createCompanyFiscalSettingsSchema.partial();

export const companyFiscalSettingsResponseSchema = z
  .object({
    id: idSchema,
    companyId: idSchema,
    nfeEnvironment: nfeEnvironmentSchema.optional(),
    nfeSeries: z.string().optional(),
    nfeLastNumber: z.number().int().optional(),
    nfeDefaultOperationNature: z.string().optional(),
    nfeDefaultCfop: z.string().optional(),
    digitalCertificateType: digitalCertificateTypeSchema,
    certificateA1ExpiresAt: z.date().optional(),
    nfceEnabled: z.boolean(),
    defaultTaxProfileId: idSchema.optional(),
    metadata: z.record(z.string(), z.unknown()),
    pendingIssues: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().optional(),
  })
  .nullable();

// ===============================================
