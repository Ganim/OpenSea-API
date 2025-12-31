/**
 * COMPANY ADDRESS SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const companyAddressTypeSchema = z.enum([
  'FISCAL',
  'DELIVERY',
  'BILLING',
  'OTHER',
]);

export const createCompanyAddressSchema = z.object({
  type: companyAddressTypeSchema.optional().default('OTHER'),
  street: z.string().max(256).optional(),
  number: z.string().max(32).optional(),
  complement: z.string().max(128).optional(),
  district: z.string().max(128).optional(),
  city: z.string().max(128).optional(),
  state: z.string().length(2).optional(),
  zip: z.string().regex(/^\d{5}-?\d{3}$/),
  ibgeCityCode: z.string().max(16).optional(),
  countryCode: z.string().max(4).optional().default('BR'),
  isPrimary: z.boolean().optional().default(false),
});

export const updateCompanyAddressSchema = createCompanyAddressSchema.partial();

export const listCompanyAddressesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  type: companyAddressTypeSchema.optional(),
  isPrimary: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export const companyAddressResponseSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  type: companyAddressTypeSchema,
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string(),
  ibgeCityCode: z.string().optional().nullable(),
  countryCode: z.string(),
  isPrimary: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  pendingIssues: z.array(z.string()),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

// ===============================================
