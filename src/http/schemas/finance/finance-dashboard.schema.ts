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

// Overview
const entryTypeCountsSchema = z.object({
  total: z.number(),
  pending: z.number(),
  overdue: z.number(),
});

const entityCountsSchema = z.object({
  total: z.number(),
  active: z.number(),
});

export const overviewResponseSchema = z.object({
  payable: entryTypeCountsSchema,
  receivable: entryTypeCountsSchema,
  loans: entityCountsSchema,
  consortia: entityCountsSchema,
  contracts: entityCountsSchema,
  recurring: entityCountsSchema,
  bankAccounts: z.number(),
  categories: z.number(),
  costCenters: z.number(),
});

// Predictive Cashflow
export const predictiveCashflowQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).optional().default(3),
});

export const predictiveCashflowResponseSchema = z.object({
  currentBalance: z.number(),
  projectedMonths: z.array(
    z.object({
      month: z.string(),
      projectedRevenue: z.number(),
      projectedExpenses: z.number(),
      projectedBalance: z.number(),
      confidence: z.number(),
      seasonalIndex: z.number(),
    }),
  ),
  dangerZones: z.array(
    z.object({
      date: z.string(),
      projectedBalance: z.number(),
      deficit: z.number(),
      suggestion: z.string(),
    }),
  ),
  dailyProjection: z.array(
    z.object({
      date: z.string(),
      balance: z.number(),
      isNegative: z.boolean(),
    }),
  ),
  suggestions: z.array(z.string()),
  dataQuality: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

// Cashflow Accuracy (Realized vs Projected)
export const cashflowAccuracyQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const cashflowAccuracyResponseSchema = z.object({
  accuracy: z.number(),
  dataPoints: z.array(
    z.object({
      date: z.string(),
      predictedInflow: z.number(),
      predictedOutflow: z.number(),
      actualInflow: z.number().nullable(),
      actualOutflow: z.number().nullable(),
    }),
  ),
  periodCount: z.number(),
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
