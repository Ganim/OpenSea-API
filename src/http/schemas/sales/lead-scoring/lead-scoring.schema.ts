import { z } from 'zod';

export const leadScoringRuleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  field: z.string(),
  condition: z.string(),
  value: z.string(),
  points: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const leadScoreResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  score: z.number().int(),
  tier: z.string(),
  factors: z.array(
    z.object({
      ruleId: z.string(),
      ruleName: z.string(),
      points: z.number().int(),
      reason: z.string(),
    }),
  ),
  calculatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const createScoringRuleSchema = z.object({
  name: z.string().min(1).max(255),
  field: z.string().min(1).max(100),
  condition: z.string().min(1).max(50),
  value: z.string().min(0).max(255),
  points: z
    .number()
    .int()
    .refine((val) => val !== 0, {
      message: 'Points must be non-zero',
    }),
  isActive: z.boolean().optional(),
});

export const updateScoringRuleSchema = createScoringRuleSchema.partial();
