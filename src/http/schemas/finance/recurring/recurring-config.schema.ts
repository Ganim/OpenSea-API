import { z } from 'zod';

export const createRecurringConfigSchema = z.object({
  type: z.enum(['PAYABLE', 'RECEIVABLE']),
  description: z.string().min(1).max(500),
  categoryId: z.string().uuid(),
  costCenterId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  supplierName: z.string().max(512).optional(),
  customerName: z.string().max(512).optional(),
  supplierId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  expectedAmount: z.number().positive(),
  isVariable: z.boolean().optional().default(false),
  frequencyUnit: z.enum([
    'DAILY',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'SEMIANNUAL',
    'ANNUAL',
  ]),
  frequencyInterval: z.number().int().positive().optional().default(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  totalOccurrences: z.number().int().positive().optional(),
  interestRate: z.number().min(0).optional(),
  penaltyRate: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateRecurringConfigSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  expectedAmount: z.number().positive().optional(),
  frequencyUnit: z
    .enum([
      'DAILY',
      'WEEKLY',
      'BIWEEKLY',
      'MONTHLY',
      'QUARTERLY',
      'SEMIANNUAL',
      'ANNUAL',
    ])
    .optional(),
  frequencyInterval: z.number().int().positive().optional(),
  endDate: z.coerce.date().nullable().optional(),
  interestRate: z.number().min(0).nullable().optional(),
  penaltyRate: z.number().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listRecurringConfigsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  type: z.enum(['PAYABLE', 'RECEIVABLE']).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
  search: z.string().optional(),
});

export const recurringConfigResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.string(),
  status: z.string(),
  description: z.string(),
  categoryId: z.string(),
  costCenterId: z.string().nullable(),
  bankAccountId: z.string().nullable(),
  supplierName: z.string().nullable(),
  customerName: z.string().nullable(),
  supplierId: z.string().nullable(),
  customerId: z.string().nullable(),
  expectedAmount: z.number(),
  isVariable: z.boolean(),
  frequencyUnit: z.string(),
  frequencyInterval: z.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  totalOccurrences: z.number().nullable(),
  generatedCount: z.number(),
  lastGeneratedDate: z.coerce.date().nullable(),
  nextDueDate: z.coerce.date().nullable(),
  interestRate: z.number().nullable(),
  penaltyRate: z.number().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

export const recurringConfigIdParamSchema = z.object({
  id: z.string().uuid(),
});
