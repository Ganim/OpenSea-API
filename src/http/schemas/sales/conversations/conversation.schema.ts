import { z } from 'zod';

export const conversationMessageResponseSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().optional(),
  senderName: z.string(),
  senderType: z.string(),
  content: z.string(),
  readAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
});

export const conversationResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  subject: z.string(),
  status: z.enum(['OPEN', 'CLOSED', 'ARCHIVED']),
  lastMessageAt: z.coerce.date().optional(),
  createdBy: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  messages: z.array(conversationMessageResponseSchema).optional(),
});

export const createConversationSchema = z.object({
  customerId: z.string().uuid(),
  subject: z.string().min(1).max(500),
});

export const sendMessageSchema = z.object({
  senderName: z.string().min(1).max(255),
  senderType: z.enum(['AGENT', 'CUSTOMER', 'SYSTEM']).default('AGENT'),
  content: z.string().min(1),
});
