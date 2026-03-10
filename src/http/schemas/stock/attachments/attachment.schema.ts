import { z } from 'zod';

export const createAttachmentBodySchema = z.object({
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  label: z.string().max(128).optional(),
  order: z.number().int().min(0).optional().default(0),
});

export const attachmentResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  label: z.string().nullable(),
  order: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
