import { z } from 'zod';

export const financeAttachmentResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  entryId: z.string().uuid(),
  type: z.string(),
  fileName: z.string(),
  fileKey: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  url: z.string().optional(),
  uploadedBy: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

export const uploadAttachmentQuerySchema = z.object({
  type: z.enum(['BOLETO', 'PAYMENT_RECEIPT', 'CONTRACT', 'INVOICE', 'OTHER']).optional().default('OTHER'),
});
