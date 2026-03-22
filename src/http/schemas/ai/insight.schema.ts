import { z } from 'zod';

export const listInsightsQuerySchema = z.object({
  status: z
    .enum(['NEW', 'VIEWED', 'ACTED_ON', 'DISMISSED', 'EXPIRED'])
    .optional(),
  type: z
    .enum([
      'TREND',
      'ANOMALY',
      'OPPORTUNITY',
      'RISK',
      'PREDICTION',
      'RECOMMENDATION',
      'ALERT',
      'CELEBRATION',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  module: z.string().max(32).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const insightParamsSchema = z.object({
  insightId: z.string().uuid(),
});

export const insightResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  type: z.string(),
  priority: z.string(),
  title: z.string(),
  content: z.string(),
  renderData: z.any().nullable().optional(),
  module: z.string(),
  relatedEntityType: z.string().nullable().optional(),
  relatedEntityId: z.string().nullable().optional(),
  status: z.string(),
  actionUrl: z.string().nullable().optional(),
  suggestedAction: z.string().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  viewedAt: z.date().nullable().optional(),
  actedOnAt: z.date().nullable().optional(),
  dismissedAt: z.date().nullable().optional(),
  createdAt: z.date(),
});
