import { z } from 'zod';

export const messageTemplateResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  channel: z.string(),
  subject: z.string().optional(),
  body: z.string(),
  variables: z.array(z.string()),
  isActive: z.boolean(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const createMessageTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'NOTIFICATION']),
  subject: z.string().max(500).optional(),
  body: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const updateMessageTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  channel: z.enum(['EMAIL', 'WHATSAPP', 'SMS', 'NOTIFICATION']).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const previewMessageTemplateSchema = z.object({
  sampleData: z.record(z.string()),
});
