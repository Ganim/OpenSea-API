import { z } from 'zod';

export const queueReceiptParamsSchema = z.object({
  orderId: z.string(),
});

export const queueReceiptBodySchema = z.object({
  printerId: z.string().optional(),
});

export const queueReceiptResponseSchema = z.object({
  jobId: z.string(),
  status: z.literal('queued'),
});

export const previewReceiptParamsSchema = z.object({
  orderId: z.string(),
});

export const previewReceiptResponseSchema = z.object({
  content: z.string(),
  format: z.literal('escpos'),
});
