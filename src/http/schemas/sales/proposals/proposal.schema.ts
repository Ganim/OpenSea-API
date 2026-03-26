import { z } from 'zod';

export const proposalItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createProposalSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  validUntil: z.coerce.date().optional(),
  terms: z.string().optional(),
  items: z.array(proposalItemSchema).min(1),
});

export const updateProposalSchema = z.object({
  customerId: z.string().uuid().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  terms: z.string().nullable().optional(),
  items: z.array(proposalItemSchema).min(1).optional(),
});

export const proposalItemResponseSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  total: z.number(),
});

export const proposalAttachmentResponseSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  fileUrl: z.string(),
  fileSize: z.number(),
  createdAt: z.coerce.date(),
});

export const proposalResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: z.string(),
  validUntil: z.coerce.date().optional(),
  terms: z.string().optional(),
  totalValue: z.number(),
  sentAt: z.coerce.date().optional(),
  viewedAt: z.coerce.date().optional(),
  viewCount: z.number(),
  lastViewedAt: z.coerce.date().optional(),
  createdBy: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
  items: z.array(proposalItemResponseSchema),
  attachments: z.array(proposalAttachmentResponseSchema),
});
