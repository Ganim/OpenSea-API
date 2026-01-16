/**
 * COMPANY SCHEMAS (formerly COMPANY)
 */

import { z } from 'zod';
import { idSchema } from '../../common.schema';
import { companyAddressResponseSchema } from './company-address.schema';
import { companyCnaeResponseSchema } from './company-cnae.schema';
import { companyFiscalSettingsResponseSchema } from './company-fiscal-settings.schema';
import { companyStakeholderResponseSchema } from './company-stakeholder.schema';

/**
 * Status da empresa
 */
export const companyStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

/**
 * Regime tributário
 */
export const companyTaxRegimeSchema = z.enum([
  'SIMPLES',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL',
  'IMUNE_ISENTA',
  'OUTROS',
]);

/**
 * Schema para criação de empresa
 */
export const createCompanySchema = z.object({
  // Campos obrigatórios
  legalName: z.string().min(2).max(256),
  cnpj: z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),

  // Campos principais opcionais
  tradeName: z.string().min(2).max(256).optional(),
  stateRegistration: z.string().max(32).optional(),
  municipalRegistration: z.string().max(32).optional(),
  legalNature: z.string().max(256).optional(),
  taxRegime: companyTaxRegimeSchema.optional(),
  taxRegimeDetail: z.string().max(256).optional(),
  activityStartDate: z.coerce.date().optional(),
  status: companyStatusSchema.optional().default('ACTIVE'),
  email: z.string().email().max(256).optional(),
  phoneMain: z.string().min(10).max(20).optional(),
  phoneAlt: z.string().min(10).max(20).optional(),
  logoUrl: z.string().url().max(512).optional(),

  // Metadados
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema para atualização de empresa
 */
export const updateCompanySchema = createCompanySchema.partial().omit({
  cnpj: true,
});

/**
 * Schema para filtros de listagem de empresas
 */
export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: companyStatusSchema.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

/**
 * Schema para resposta de empresa
 */
export const companyResponseSchema = z.object({
  id: idSchema,
  legalName: z.string(),
  cnpj: z.string(),

  // Campos principais
  tradeName: z.string().optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  legalNature: z.string().optional(),
  taxRegime: companyTaxRegimeSchema.optional(),
  taxRegimeDetail: z.string().optional(),
  activityStartDate: z.string().optional(),
  status: companyStatusSchema,
  email: z.string().optional(),
  phoneMain: z.string().optional(),
  phoneAlt: z.string().optional(),
  logoUrl: z.string().optional(),

  // Metadados
  metadata: z.record(z.string(), z.unknown()).optional(),
  pendingIssues: z.array(z.string()).optional(),

  // Audit
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().optional(),
});

/**
 * Schema para verificar CNPJ
 */
export const checkCnpjSchema = z.object({
  cnpj: z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
});

/**
 * Schema para resposta de departamento resumida
 */
export const departmentSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string(),
  isActive: z.boolean(),
});

/**
 * Schema para resposta de empresa com detalhes (GET by ID)
 */
export const companyWithDetailsResponseSchema = companyResponseSchema.extend({
  departments: z.array(departmentSummarySchema).optional(),
  departmentsCount: z.number(),
  addresses: z.array(companyAddressResponseSchema).optional(),
  cnaes: z.array(companyCnaeResponseSchema).optional(),
  fiscalSettings: companyFiscalSettingsResponseSchema.optional(),
  stakeholders: z.array(companyStakeholderResponseSchema).optional(),
});

// ===============================================
