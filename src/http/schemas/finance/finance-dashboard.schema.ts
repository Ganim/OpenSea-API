import { z } from 'zod';

// Forecast
export const forecastQuerySchema = z.object({
  type: z.enum(['PAYABLE', 'RECEIVABLE']).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('month'),
  costCenterId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

export const forecastResponseSchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      payable: z.number(),
      receivable: z.number(),
      net: z.number(),
      cumulativeNet: z.number(),
    }),
  ),
  totals: z.object({
    totalPayable: z.number(),
    totalReceivable: z.number(),
    netBalance: z.number(),
  }),
  byCategory: z.array(
    z.object({
      categoryId: z.string(),
      categoryName: z.string(),
      total: z.number(),
    }),
  ),
  byCostCenter: z.array(
    z.object({
      costCenterId: z.string(),
      costCenterName: z.string(),
      total: z.number(),
    }),
  ),
});

// Dashboard
export const dashboardResponseSchema = z.object({
  totalPayable: z.number(),
  totalReceivable: z.number(),
  overduePayable: z.number(),
  overdueReceivable: z.number(),
  overduePayableCount: z.number(),
  overdueReceivableCount: z.number(),
  paidThisMonth: z.number(),
  receivedThisMonth: z.number(),
  upcomingPayable7Days: z.number(),
  upcomingReceivable7Days: z.number(),
  cashBalance: z.number(),
  statusCounts: z.record(z.string(), z.number()),
  topOverdueReceivables: z.array(
    z.object({
      name: z.string(),
      total: z.number(),
      count: z.number(),
      oldestDueDate: z.coerce.date(),
    }),
  ),
  topOverduePayables: z.array(
    z.object({
      name: z.string(),
      total: z.number(),
      count: z.number(),
      oldestDueDate: z.coerce.date(),
    }),
  ),
});

// Cashflow
export const cashflowQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('month'),
  bankAccountId: z.string().uuid().optional(),
});

export const cashflowResponseSchema = z.object({
  data: z.array(
    z.object({
      date: z.string(),
      inflow: z.number(),
      outflow: z.number(),
      net: z.number(),
      cumulativeBalance: z.number(),
    }),
  ),
  summary: z.object({
    totalInflow: z.number(),
    totalOutflow: z.number(),
    netFlow: z.number(),
    openingBalance: z.number(),
    closingBalance: z.number(),
  }),
});
