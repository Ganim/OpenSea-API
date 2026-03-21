import { z } from 'zod';

export const listActionLogsQuerySchema = z.object({
  status: z.enum(['PROPOSED', 'CONFIRMED', 'EXECUTED', 'FAILED', 'CANCELLED']).optional(),
  targetModule: z.string().max(32).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const actionLogResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  conversationId: z.string().nullable(),
  messageId: z.string().nullable(),
  actionType: z.string(),
  targetModule: z.string(),
  targetEntityType: z.string(),
  targetEntityId: z.string().nullable(),
  input: z.any(),
  output: z.any().nullable(),
  status: z.string(),
  confirmedByUserId: z.string().nullable(),
  confirmedAt: z.date().nullable(),
  executedAt: z.date().nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
});
