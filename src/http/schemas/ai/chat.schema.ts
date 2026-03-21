import { z } from 'zod';

export const sendMessageBodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  content: z.string().min(1).max(4000),
  context: z.enum(['DEDICATED', 'INLINE', 'COMMAND_BAR', 'VOICE']).optional(),
  contextModule: z.string().max(32).optional(),
  contextEntityType: z.string().max(64).optional(),
  contextEntityId: z.string().uuid().optional(),
  attachments: z.record(z.string(), z.unknown()).optional(),
});

export const listConversationsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  search: z.string().max(256).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const getConversationParamsSchema = z.object({
  conversationId: z.string().uuid(),
});

export const getConversationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const archiveConversationParamsSchema = z.object({
  conversationId: z.string().uuid(),
});

export const conversationResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  title: z.string().nullable(),
  status: z.string(),
  context: z.string(),
  contextModule: z.string().nullable().optional(),
  messageCount: z.number(),
  lastMessageAt: z.date().nullable(),
  isPinned: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const messageResponseSchema = z.object({
  id: z.string(),
  conversationId: z.string().optional(),
  role: z.string(),
  content: z.string().nullable(),
  contentType: z.string(),
  renderData: z.any().nullable().optional(),
  attachments: z.any().nullable().optional(),
  aiModel: z.string().nullable().optional(),
  aiLatencyMs: z.number().nullable().optional(),
  toolCalls: z.any().nullable().optional(),
  actionsTaken: z.any().nullable().optional(),
  audioUrl: z.string().nullable().optional(),
  transcription: z.string().nullable().optional(),
  createdAt: z.date(),
});
