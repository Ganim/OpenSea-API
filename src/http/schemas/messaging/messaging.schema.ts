import { z } from 'zod';

// ── Enums ───────────────────────────────────────────────────────────────────

export const messagingChannelSchema = z.enum([
  'WHATSAPP',
  'INSTAGRAM',
  'TELEGRAM',
]);

export const messagingAccountStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'ERROR',
]);

export const messagingDirectionSchema = z.enum(['INBOUND', 'OUTBOUND']);

export const messagingMessageTypeSchema = z.enum([
  'TEXT',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'DOCUMENT',
  'LOCATION',
  'TEMPLATE',
  'INTERACTIVE',
]);

export const messagingMessageStatusSchema = z.enum([
  'PENDING',
  'SENT',
  'DELIVERED',
  'READ',
  'FAILED',
]);

// ── Messaging Account ───────────────────────────────────────────────────────

export const messagingAccountResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  channel: messagingChannelSchema,
  name: z.string(),
  status: messagingAccountStatusSchema,
  phoneNumber: z.string().nullable(),
  wabaId: z.string().nullable(),
  igAccountId: z.string().nullable(),
  tgBotUsername: z.string().nullable(),
  webhookUrl: z.string().nullable(),
  settings: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createMessagingAccountBodySchema = z.object({
  channel: messagingChannelSchema,
  name: z.string().min(1).max(128),
  phoneNumber: z.string().max(32).optional(),
  wabaId: z.string().max(64).optional(),
  igAccountId: z.string().max(64).optional(),
  tgBotToken: z.string().max(256).optional(),
  tgBotUsername: z.string().max(128).optional(),
  accessToken: z.string().max(1024).optional(),
  refreshToken: z.string().max(1024).optional(),
  tokenExpiresAt: z.coerce.date().optional(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().max(256).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// ── Messaging Contact ───────────────────────────────────────────────────────

export const messagingContactResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  accountId: z.string().uuid(),
  channel: messagingChannelSchema,
  externalId: z.string(),
  name: z.string().nullable(),
  username: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  customerId: z.string().uuid().nullable(),
  lastMessageAt: z.coerce.date().nullable(),
  unreadCount: z.number().int(),
  isBlocked: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  channel: messagingChannelSchema.optional(),
  search: z.string().optional(),
});

// ── Messaging Message ───────────────────────────────────────────────────────

export const messagingMessageResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  accountId: z.string().uuid(),
  contactId: z.string().uuid(),
  channel: messagingChannelSchema,
  direction: messagingDirectionSchema,
  type: messagingMessageTypeSchema,
  status: messagingMessageStatusSchema,
  text: z.string().nullable(),
  mediaUrl: z.string().nullable(),
  mediaType: z.string().nullable(),
  fileName: z.string().nullable(),
  templateName: z.string().nullable(),
  templateParams: z.record(z.string(), z.string()).nullable(),
  externalId: z.string().nullable(),
  replyToMessageId: z.string().uuid().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  sentAt: z.coerce.date().nullable(),
  deliveredAt: z.coerce.date().nullable(),
  readAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const sendMessageBodySchema = z.object({
  accountId: z.string().uuid(),
  contactId: z.string().uuid(),
  text: z.string().max(4096).optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.string().max(64).optional(),
  fileName: z.string().max(256).optional(),
  templateName: z.string().max(128).optional(),
  templateParams: z.record(z.string(), z.string()).optional(),
  replyToMessageId: z.string().uuid().optional(),
});

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const contactIdParamsSchema = z.object({
  contactId: z.string().uuid(),
});

// ── Pagination Meta ─────────────────────────────────────────────────────────

export const paginationMetaSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  pages: z.number().int(),
});
