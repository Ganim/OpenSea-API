import { z } from 'zod';

export const chatbotConfigResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  greeting: z.string(),
  autoReplyMessage: z.string().optional(),
  assignToUserId: z.string().uuid().optional(),
  formId: z.string().uuid().optional(),
  primaryColor: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const updateChatbotConfigSchema = z.object({
  greeting: z.string().min(1).max(500).optional(),
  autoReplyMessage: z.string().nullable().optional(),
  assignToUserId: z.string().uuid().nullable().optional(),
  formId: z.string().uuid().nullable().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  isActive: z.boolean().optional(),
});

export const chatbotPublicConfigResponseSchema = z.object({
  greeting: z.string(),
  primaryColor: z.string(),
});

export const chatbotMessageBodySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional(),
  message: z.string().min(1).max(5000),
});

export const chatbotMessageResponseSchema = z.object({
  conversationId: z.string().uuid(),
  userMessage: z.object({
    id: z.string().uuid(),
    conversationId: z.string().uuid(),
    senderName: z.string(),
    senderType: z.string(),
    content: z.string(),
    createdAt: z.coerce.date(),
  }),
  autoReply: z
    .object({
      id: z.string().uuid(),
      conversationId: z.string().uuid(),
      senderName: z.string(),
      senderType: z.string(),
      content: z.string(),
      createdAt: z.coerce.date(),
    })
    .optional(),
  config: chatbotPublicConfigResponseSchema,
});
