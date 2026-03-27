import { z } from 'zod';

export const predictionFactorSchema = z.object({
  factor: z.string(),
  impact: z.number(),
  description: z.string(),
});

export const dealPredictionResponseSchema = z.object({
  id: z.string().uuid(),
  dealId: z.string().uuid(),
  probability: z.number(),
  estimatedCloseDate: z.coerce.date().optional(),
  confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  factors: z.array(predictionFactorSchema),
  modelVersion: z.string(),
  createdAt: z.coerce.date(),
});

export const batchPredictResponseSchema = z.object({
  predictions: z.array(dealPredictionResponseSchema),
  processedCount: z.number(),
});
