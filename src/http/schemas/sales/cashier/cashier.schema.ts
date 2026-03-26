import { z } from 'zod';

export const cashierTransactionResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  type: z.enum(['SALE', 'REFUND', 'CASH_IN', 'CASH_OUT']),
  amount: z.number(),
  description: z.string().optional(),
  paymentMethod: z.string().optional(),
  referenceId: z.string().optional(),
  createdAt: z.coerce.date(),
});

export const cashierSessionResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  cashierId: z.string(),
  posTerminalId: z.string().optional(),
  openedAt: z.coerce.date(),
  closedAt: z.coerce.date().optional(),
  openingBalance: z.number(),
  closingBalance: z.number().optional(),
  expectedBalance: z.number().optional(),
  difference: z.number().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'RECONCILED']),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  transactions: z.array(cashierTransactionResponseSchema).optional(),
});

export const openCashierSessionSchema = z.object({
  posTerminalId: z.string().uuid().optional(),
  openingBalance: z.number().min(0),
  notes: z.string().optional(),
});

export const closeCashierSessionSchema = z.object({
  closingBalance: z.number(),
});

export const createCashierTransactionSchema = z.object({
  type: z.enum(['SALE', 'REFUND', 'CASH_IN', 'CASH_OUT']),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  paymentMethod: z.string().max(50).optional(),
  referenceId: z.string().optional(),
});

export const cashMovementSchema = z.object({
  type: z.enum(['CASH_IN', 'CASH_OUT']),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
});
