/**
 * COMPANY CNAE SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const companyCnaeStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export const createCompanyCnaeSchema = z.object({
  code: z.string().regex(/^\d{7}$/, 'CNAE code must be exactly 7 digits'),
  description: z.string().max(256).optional(),
  isPrimary: z.boolean().optional().default(false),
  status: companyCnaeStatusSchema.optional().default('ACTIVE'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateCompanyCnaeSchema = createCompanyCnaeSchema.partial();

export const listCompanyCnaesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  code: z.string().optional(),
  isPrimary: z.coerce.boolean().optional(),
  status: companyCnaeStatusSchema.optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

export const companyCnaeResponseSchema = z.object({
  id: idSchema,
  companyId: idSchema,
  code: z.string(),
  description: z.string().optional().nullable(),
  isPrimary: z.boolean(),
  status: companyCnaeStatusSchema,
  metadata: z.record(z.string(), z.unknown()),
  pendingIssues: z.array(z.string()),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

// ===============================================
