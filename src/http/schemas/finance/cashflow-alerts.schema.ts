import { z } from 'zod';

export const cashFlowAlertSchema = z.object({
  type: z.enum(['NEGATIVE_BALANCE', 'LOW_BALANCE', 'LARGE_OUTFLOW']),
  severity: z.enum(['WARNING', 'CRITICAL']),
  message: z.string(),
  projectedDate: z.string(),
  projectedBalance: z.number(),
  bankAccountId: z.string().optional(),
  bankAccountName: z.string().optional(),
});

export const sevenDayProjectionSchema = z.object({
  totalInflows: z.number(),
  totalOutflows: z.number(),
  projectedBalance: z.number(),
});

export const cashFlowAlertsResponseSchema = z.object({
  alerts: z.array(cashFlowAlertSchema),
  nextSevenDays: sevenDayProjectionSchema,
});
