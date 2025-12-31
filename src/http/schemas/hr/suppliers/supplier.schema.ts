/**
 * HR Supplier Schemas
 * Schemas for HR supplier (organization) validation
 */

import { z } from 'zod';
import { idSchema, emailSchema, phoneSchema } from '../../common.schema';

/**
 * Status da organização (Supplier, Manufacturer)
 */
export const organizationStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'BLOCKED',
]);

/**
 * Tax regime enum
 */
export const taxRegimeSchema = z.enum([
  'SIMPLES',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL',
  'IMUNE_ISENTA',
  'OUTROS',
]);

/**
 * Schema para criação de fornecedor
 */
export const createSupplierSchema = z.object({
  // Campos obrigatórios
  legalName: z.string().min(2).max(256),

  // Identificação fiscal (ao menos um obrigatório)
  cnpj: z
    .string()
    .regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .optional()
    .nullable(),
  cpf: z
    .string()
    .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .optional()
    .nullable(),

  // Campos principais opcionais
  tradeName: z.string().min(2).max(256).optional().nullable(),
  stateRegistration: z.string().max(128).optional().nullable(),
  municipalRegistration: z.string().max(128).optional().nullable(),
  taxRegime: taxRegimeSchema.optional().nullable(),
  status: organizationStatusSchema.optional().default('ACTIVE'),
  email: emailSchema.optional(),
  phoneMain: phoneSchema.optional(),
  website: z.string().url().max(512).optional().nullable(),

  // Campos específicos de fornecedor
  paymentTerms: z.string().max(256).optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  isPreferredSupplier: z.boolean().optional().default(false),
  contractNumber: z.string().max(128).optional().nullable(),
  contractStartDate: z.coerce.date().optional().nullable(),
  contractEndDate: z.coerce.date().optional().nullable(),
  leadTime: z.number().int().positive().optional().nullable(),
  minimumOrderValue: z.number().positive().optional().nullable(),
  externalId: z.string().max(128).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),

  // Metadados
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

/**
 * Schema para atualização de fornecedor
 */
export const updateSupplierSchema = createSupplierSchema.partial().omit({
  cnpj: true,
  cpf: true,
});

/**
 * Schema para filtros de listagem de fornecedores
 */
export const listSuppliersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: organizationStatusSchema.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

/**
 * Schema para resposta de fornecedor
 */
export const supplierResponseSchema = z.object({
  id: idSchema,
  type: z.literal('SUPPLIER'),
  legalName: z.string(),
  cnpj: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),

  // Campos principais
  tradeName: z.string().optional().nullable(),
  stateRegistration: z.string().optional().nullable(),
  municipalRegistration: z.string().optional().nullable(),
  taxRegime: taxRegimeSchema.optional().nullable(),
  status: organizationStatusSchema,
  email: z.string().optional().nullable(),
  phoneMain: z.string().optional().nullable(),
  website: z.string().optional().nullable(),

  // Campos específicos de fornecedor
  paymentTerms: z.string().optional().nullable(),
  rating: z.number().optional().nullable(),
  isPreferredSupplier: z.boolean(),
  contractNumber: z.string().optional().nullable(),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  leadTime: z.number().optional().nullable(),
  minimumOrderValue: z.number().optional().nullable(),
  sequentialCode: z.number().optional(),
  externalId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  // Metadados
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),

  // Audit
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().optional().nullable(),
});

// ===============================================
