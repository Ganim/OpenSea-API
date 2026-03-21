import { z } from 'zod';

export const openPosSessionSchema = z.object({
  terminalId: z.string().uuid(),
  openingBalance: z.number().min(0),
});

export const closePosSessionSchema = z.object({
  closingBalance: z.number().min(0),
  closingBreakdown: z
    .object({
      cash: z.number().optional(),
      creditCard: z.number().optional(),
      debitCard: z.number().optional(),
      pix: z.number().optional(),
      checks: z.number().optional(),
      other: z.number().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

export const posSessionResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  terminalId: z.string(),
  operatorUserId: z.string(),
  status: z.string(),
  openedAt: z.date(),
  closedAt: z.date().nullable(),
  openingBalance: z.number(),
  closingBalance: z.number().nullable(),
  expectedBalance: z.number().nullable(),
  difference: z.number().nullable(),
  closingBreakdown: z.record(z.string(), z.unknown()).nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});
