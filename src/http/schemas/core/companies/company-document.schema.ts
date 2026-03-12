/**
 * COMPANY DOCUMENT SCHEMAS
 */

import { z } from 'zod';

export const companyDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  documentType: z.string(),
  fileName: z.string().nullable(),
  fileKey: z.string().nullable(),
  fileSize: z.number().int().nullable(),
  mimeType: z.string().nullable(),
  expiresAt: z.string().nullable(),
  notes: z.string().nullable(),
  uploadedBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listCompanyDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  documentType: z.string().optional(),
});
