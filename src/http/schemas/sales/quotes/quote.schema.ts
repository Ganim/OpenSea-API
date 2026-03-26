import { z } from 'zod';

export const quoteItemSchema = z.object({
  variantId: z.string().uuid().optional(),
  productName: z.string().min(1).max(255),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
});

export const createQuoteSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().min(1).max(255),
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional(),
  discount: z.number().nonnegative().optional(),
  items: z.array(quoteItemSchema).min(1),
});

export const updateQuoteSchema = z.object({
  customerId: z.string().uuid().optional(),
  title: z.string().min(1).max(255).optional(),
  validUntil: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
  discount: z.number().nonnegative().optional(),
  items: z.array(quoteItemSchema).min(1).optional(),
});

export const quoteItemResponseSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  productName: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  discount: z.number(),
  total: z.number(),
});

export const quoteResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  validUntil: z.coerce.date().optional(),
  notes: z.string().optional(),
  subtotal: z.number(),
  discount: z.number(),
  total: z.number(),
  sentAt: z.coerce.date().optional(),
  createdBy: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
  items: z.array(quoteItemResponseSchema),
});
