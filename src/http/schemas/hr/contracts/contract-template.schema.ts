/**
 * CONTRACT TEMPLATE SCHEMAS
 * ----------------------------------------------------------------------------
 * Zod schemas for HR contract template endpoints (CRUD + generation).
 * IDs use the CUID format because the ContractTemplate /
 * GeneratedEmploymentContract models declare @default(cuid()).
 */

import { z } from 'zod';
import { cuidSchema, dateSchema, idSchema, queryBooleanSchema } from '../../common.schema';

export const contractTemplateTypeSchema = z.enum([
  'CLT',
  'PJ',
  'INTERN',
  'TEMPORARY',
  'EXPERIENCE',
  'CUSTOM',
]);

export const createContractTemplateBodySchema = z.object({
  name: z.string().min(2).max(256),
  type: contractTemplateTypeSchema,
  content: z.string().min(1),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
});

export const updateContractTemplateBodySchema =
  createContractTemplateBodySchema.partial();

export const listContractTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  type: contractTemplateTypeSchema.optional(),
  isActive: queryBooleanSchema.optional(),
});

export const contractTemplateResponseSchema = z.object({
  id: cuidSchema,
  name: z.string(),
  type: contractTemplateTypeSchema,
  content: z.string(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

export const contractTemplateSummaryResponseSchema = z.object({
  id: cuidSchema,
  name: z.string(),
  type: contractTemplateTypeSchema,
  isActive: z.boolean(),
  isDefault: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const contractTemplateIdParamSchema = z.object({
  id: cuidSchema,
});

// ─── Generation / download ─────────────────────────────────────────────────

export const generateContractBodySchema = z.object({
  templateId: cuidSchema,
  additionalVars: z.record(z.string(), z.unknown()).optional(),
  companyName: z.string().max(256).optional(),
  companyCnpj: z.string().max(32).optional(),
});

export const generateContractResponseSchema = z.object({
  contract: z.object({
    id: cuidSchema,
    templateId: cuidSchema,
    employeeId: idSchema,
    generatedBy: idSchema,
    pdfUrl: z.string().nullable(),
    pdfKey: z.string().nullable(),
    storageFileId: z.string().nullable(),
    variables: z.record(z.string(), z.unknown()),
    createdAt: dateSchema,
  }),
  pdfUrl: z.string(),
  base64: z.string(),
});

export const generatedContractResponseSchema = z.object({
  id: cuidSchema,
  templateId: cuidSchema,
  employeeId: idSchema,
  generatedBy: idSchema,
  pdfUrl: z.string().nullable(),
  pdfKey: z.string().nullable(),
  storageFileId: z.string().nullable(),
  variables: z.record(z.string(), z.unknown()),
  createdAt: dateSchema,
});

export const employeeContractsResponseSchema = z.object({
  contracts: z.array(generatedContractResponseSchema),
});

export const employeeContractsParamSchema = z.object({
  id: idSchema,
});

export const generatedContractIdParamSchema = z.object({
  id: cuidSchema,
});
