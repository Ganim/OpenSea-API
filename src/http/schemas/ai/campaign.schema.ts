import { z } from 'zod';

export const campaignInsightParamsSchema = z.object({
  insightId: z.string().uuid(),
});

export const campaignSuggestionSchema = z.object({
  title: z.string(),
  type: z.enum([
    'LIQUIDATION',
    'SEASONAL',
    'CROSS_SELL',
    'LAUNCH',
    'OVERSTOCK',
  ]),
  description: z.string(),
  targetProducts: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      currentStock: z.number(),
    }),
  ),
  suggestedDiscount: z.number().optional(),
  estimatedImpact: z.object({
    revenueRecovery: z.number().optional(),
    stockReduction: z.string().optional(),
    marginImpact: z.string().optional(),
  }),
  suggestedActions: z.array(
    z.object({
      tool: z.string(),
      description: z.string(),
      args: z.record(z.string(), z.unknown()),
    }),
  ),
});

export const generateCampaignsResponseSchema = z.object({
  suggestions: z.array(campaignSuggestionSchema),
  insightIds: z.array(z.string()),
  aiModel: z.string(),
});

export const applyCampaignResponseSchema = z.object({
  success: z.boolean(),
  executedActions: z.array(
    z.object({
      tool: z.string(),
      description: z.string(),
      result: z.any().nullable(),
      error: z.string().optional(),
    }),
  ),
});
