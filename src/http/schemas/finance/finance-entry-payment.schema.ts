import { z } from 'zod';

export const registerPaymentSchema = z.object({
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  bankAccountId: z.string().uuid().optional(),
  method: z.string().max(32).optional(),
  reference: z.string().max(128).optional(),
  notes: z.string().optional(),
});

export const financeEntryPaymentResponseSchema = z.object({
  id: z.string().uuid(),
  entryId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional().nullable(),
  amount: z.number(),
  paidAt: z.coerce.date(),
  method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});
