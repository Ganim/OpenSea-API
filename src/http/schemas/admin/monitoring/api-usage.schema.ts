import z from 'zod';

export const apiUsageQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional()
    .describe('Period in YYYY-MM format. Defaults to current month.'),
});

const metricUsageSchema = z.object({
  metric: z.string(),
  used: z.number(),
  included: z.number(),
  overage: z.number(),
  cost: z.number(),
});

const categoryUsageSchema = z.object({
  category: z.string(),
  label: z.string(),
  color: z.string(),
  totalUsed: z.number(),
  totalIncluded: z.number(),
  totalOverage: z.number(),
  totalCost: z.number(),
  metrics: z.array(metricUsageSchema),
});

const topTenantByCostSchema = z.object({
  tenantId: z.string(),
  totalCost: z.number(),
  breakdown: z.record(z.string(), z.number()),
});

export const apiUsageResponseSchema = z.object({
  period: z.string(),
  totalCost: z.number(),
  categories: z.array(categoryUsageSchema),
  topTenantsByCost: z.array(topTenantByCostSchema),
});
