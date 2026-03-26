import { z } from 'zod';

export const supplierSummaryQuerySchema = z
  .object({
    supplierName: z.string().max(256).optional(),
    supplierId: z.string().uuid().optional(),
    customerName: z.string().max(256).optional(),
    customerId: z.string().uuid().optional(),
  })
  .refine(
    (data) =>
      data.supplierName ||
      data.supplierId ||
      data.customerName ||
      data.customerId,
    {
      message:
        'Ao menos um parâmetro é obrigatório: supplierName, supplierId, customerName ou customerId',
    },
  );

export const monthlyTrendSchema = z.object({
  month: z.string(),
  total: z.number(),
  count: z.number(),
});

export const recentEntrySummarySchema = z.object({
  id: z.string(),
  description: z.string(),
  expectedAmount: z.number(),
  dueDate: z.string(),
  status: z.string(),
});

export const supplierSummaryResponseSchema = z.object({
  totalPaid: z.number(),
  totalPending: z.number(),
  totalOverdue: z.number(),
  entryCount: z.number(),
  avgAmount: z.number(),
  firstEntryDate: z.string().nullable(),
  lastEntryDate: z.string().nullable(),
  monthlyTrend: z.array(monthlyTrendSchema),
  recentEntries: z.array(recentEntrySummarySchema),
});
