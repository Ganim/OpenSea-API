import { z } from 'zod';

export const createContractSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().optional(),
  companyId: z.string().uuid().optional(),
  companyName: z.string().min(1).max(256),
  contactName: z.string().max(128).optional(),
  contactEmail: z.string().email().max(256).optional(),
  totalValue: z.number().positive(),
  paymentFrequency: z.enum([
    'DAILY',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'SEMIANNUAL',
    'ANNUAL',
  ]),
  paymentAmount: z.number().positive(),
  categoryId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  autoRenew: z.boolean().optional().default(false),
  renewalPeriodMonths: z.number().int().positive().optional(),
  alertDaysBefore: z.number().int().min(1).max(365).optional().default(30),
  notes: z.string().optional(),
});

export const updateContractSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  companyName: z.string().min(1).max(256).optional(),
  contactName: z.string().max(128).nullable().optional(),
  contactEmail: z.string().email().max(256).nullable().optional(),
  totalValue: z.number().positive().optional(),
  paymentFrequency: z
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
  paymentAmount: z.number().positive().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  costCenterId: z.string().uuid().nullable().optional(),
  bankAccountId: z.string().uuid().nullable().optional(),
  endDate: z.coerce.date().optional(),
  autoRenew: z.boolean().optional(),
  renewalPeriodMonths: z.number().int().positive().nullable().optional(),
  alertDaysBefore: z.number().int().min(1).max(365).optional(),
  folderPath: z.string().max(512).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const contractResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  status: z.string(),
  companyId: z.string().optional().nullable(),
  companyName: z.string(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  totalValue: z.number(),
  paymentFrequency: z.string(),
  paymentAmount: z.number(),
  categoryId: z.string().optional().nullable(),
  costCenterId: z.string().optional().nullable(),
  bankAccountId: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  autoRenew: z.boolean(),
  renewalPeriodMonths: z.number().optional().nullable(),
  alertDaysBefore: z.number(),
  folderPath: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean(),
  isCancelled: z.boolean(),
  isExpired: z.boolean(),
  daysUntilExpiration: z.number(),
  createdBy: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
});

// P2-45: contracts accept the canonical `startDateFrom/To` +
// `endDateFrom/To` filters. For UI consistency the generic aliases
// `dateFrom/To` are also accepted and collapsed into `startDateFrom/To`
// post-parse (contracts are typically filtered by their start date on
// list pages).
export const listContractsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    // P1-41: enum previously advertised `monthlyValue`, but the Contract
    // model column is `paymentAmount`. Renamed to match the real column
    // name (the repo used to alias `monthlyValue` → `paymentAmount`;
    // alias dropped).
    sortBy: z
      .enum(['createdAt', 'startDate', 'endDate', 'paymentAmount', 'status'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    status: z
      .enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'RENEWED', 'CANCELLED'])
      .optional(),
    companyName: z.string().optional(),
    search: z.string().optional(),
    startDateFrom: z.coerce.date().optional(),
    startDateTo: z.coerce.date().optional(),
    endDateFrom: z.coerce.date().optional(),
    endDateTo: z.coerce.date().optional(),
    // P2-45: generic aliases collapsed below
    dateFrom: z.coerce
      .date()
      .optional()
      .describe('Alias genérico de startDateFrom'),
    dateTo: z.coerce
      .date()
      .optional()
      .describe('Alias genérico de startDateTo'),
  })
  .transform((query) => ({
    ...query,
    startDateFrom: query.startDateFrom ?? query.dateFrom,
    startDateTo: query.startDateTo ?? query.dateTo,
  }));

export const supplierHistoryQuerySchema = z.object({
  companyId: z.string().uuid().optional(),
  companyName: z.string().optional(),
});

export const supplierHistoryResponseSchema = z.object({
  contracts: z.array(contractResponseSchema),
  totalContracts: z.number(),
  totalPaymentsValue: z.number(),
  totalPaymentsCount: z.number(),
});
