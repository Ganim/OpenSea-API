import { z } from 'zod';

export const createJournalEntrySchema = z
  .object({
    date: z.coerce.date(),
    description: z.string().min(1).max(256),
    sourceType: z
      .enum(['FINANCE_ENTRY', 'FINANCE_PAYMENT', 'MANUAL'])
      .default('MANUAL'),
    sourceId: z.string().uuid().optional(),
    lines: z
      .array(
        z.object({
          chartOfAccountId: z.string().uuid(),
          type: z.enum(['DEBIT', 'CREDIT']),
          amount: z.number().positive(),
          description: z.string().max(256).optional(),
        }),
      )
      .min(2),
  })
  .refine(
    (data) => {
      const debits = data.lines
        .filter((l) => l.type === 'DEBIT')
        .reduce((s, l) => s + l.amount, 0);
      const credits = data.lines
        .filter((l) => l.type === 'CREDIT')
        .reduce((s, l) => s + l.amount, 0);
      return Math.abs(debits - credits) < 0.01;
    },
    { message: 'Debitos e creditos devem ser iguais' },
  );

export const listJournalEntriesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  chartOfAccountId: z.string().uuid().optional(),
  sourceType: z.enum(['FINANCE_ENTRY', 'FINANCE_PAYMENT', 'MANUAL']).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export const ledgerQuerySchema = z.object({
  chartOfAccountId: z.string().uuid(),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const trialBalanceQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const journalEntryResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  date: z.coerce.date(),
  description: z.string(),
  sourceType: z.string(),
  sourceId: z.string().nullable(),
  status: z.string(),
  reversedById: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  lines: z.array(
    z.object({
      id: z.string().uuid(),
      chartOfAccountId: z.string().uuid(),
      chartOfAccountCode: z.string().optional(),
      chartOfAccountName: z.string().optional(),
      type: z.string(),
      amount: z.number(),
      description: z.string().nullable(),
    }),
  ),
});
