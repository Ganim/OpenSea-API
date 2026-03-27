import { z } from 'zod';

export const sentimentAnalysisResponseSchema = z.object({
  conversationId: z.string().uuid(),
  overallSentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
  messageSentiments: z.array(
    z.object({
      messageId: z.string().uuid(),
      sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']),
      score: z.number(),
    }),
  ),
  positiveCount: z.number(),
  neutralCount: z.number(),
  negativeCount: z.number(),
});

export const sentimentSummaryResponseSchema = z.object({
  conversationId: z.string().uuid(),
  overallSentiment: z.string().nullable(),
  messages: z.array(
    z.object({
      messageId: z.string().uuid(),
      sentiment: z.string().nullable(),
      senderName: z.string(),
      senderType: z.string(),
      createdAt: z.coerce.date(),
    }),
  ),
});
