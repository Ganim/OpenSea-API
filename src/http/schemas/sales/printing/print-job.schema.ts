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

export const createLabelPrintJobBodySchema = z.object({
  printerId: z.string(),
  content: z.string(),
  copies: z.number().int().min(1).max(999).optional(),
  templateData: z.record(z.unknown()).optional(),
});

export const createLabelPrintJobResponseSchema = z.object({
  jobId: z.string(),
  status: z.literal('queued'),
});

export const listPrintJobsQuerySchema = z.object({
  status: z
    .enum(['CREATED', 'QUEUED', 'PRINTING', 'SUCCESS', 'FAILED', 'CANCELLED'])
    .optional(),
  printerId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listPrintJobsResponseSchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string(),
      printerId: z.string(),
      printerName: z.string().nullable(),
      type: z.string(),
      status: z.string(),
      copies: z.number(),
      createdAt: z.string(),
      completedAt: z.string().nullable(),
      errorMessage: z.string().nullable(),
    }),
  ),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }),
});

export const retryPrintJobParamsSchema = z.object({
  id: z.string(),
});
