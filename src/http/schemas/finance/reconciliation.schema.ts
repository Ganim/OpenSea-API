import { z } from 'zod';

export const reconciliationItemResponseSchema = z.object({
  id: z.string().uuid(),
  reconciliationId: z.string().uuid(),
  fitId: z.string(),
  transactionDate: z.coerce.date(),
  amount: z.number(),
  description: z.string(),
  type: z.string(),
  matchedEntryId: z.string().uuid().optional().nullable(),
  matchConfidence: z.number().optional().nullable(),
  matchStatus: z.string(),
  createdAt: z.coerce.date(),
});

export const reconciliationResponseSchema = z.object({
  id: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  importDate: z.coerce.date(),
  fileName: z.string(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  totalTransactions: z.number().int(),
  matchedCount: z.number().int(),
  unmatchedCount: z.number().int(),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
  items: z.array(reconciliationItemResponseSchema).optional(),
});

export const listReconciliationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  bankAccountId: z.string().uuid().optional(),
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const manualMatchBodySchema = z.object({
  entryId: z.string().uuid(),
});

export const createEntryFromItemBodySchema = z.object({
  categoryId: z.string().uuid(),
});

export const paginationMetaSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  pages: z.number().int(),
});
