import { z } from 'zod';

export const invoiceTypeSchema = z.enum(['NFE', 'NFCE']).default('NFCE');

export const invoiceStatusSchema = z.enum([
  'PENDING',
  'ISSUED',
  'CANCELLED',
  'ERROR',
]);

// Request para issue invoice
export const issueInvoiceRequestSchema = z.object({
  invoiceType: invoiceTypeSchema.optional(),
});

// Response para issue invoice
export const issueInvoiceResponseSchema = z.object({
  invoiceId: z.string().uuid(),
  accessKey: z.string().min(44).max(44),
  status: invoiceStatusSchema,
  issuedAt: z.date(),
  xmlUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
});

// Request params para get invoice
export const getInvoiceParamsSchema = z.object({
  invoiceId: z.string().uuid(),
});

// Response para get invoice
export const invoiceDetailResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  orderId: z.string(),
  type: invoiceTypeSchema,
  number: z.string().max(10),
  series: z.string().max(3),
  accessKey: z.string().min(44).max(44),
  focusIdRef: z.string().optional(),
  status: invoiceStatusSchema,
  statusDetails: z.string().optional(),
  xmlUrl: z.string().url().optional(),
  pdfUrl: z.string().url().optional(),
  issuedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  cancelReason: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

// Request para cancel invoice
export const cancelInvoiceRequestSchema = z.object({
  reason: z.string().min(10).max(500),
});

// Response para cancel invoice
export const cancelInvoiceResponseSchema = z.object({
  invoiceId: z.string().uuid(),
  status: invoiceStatusSchema,
  cancelledAt: z.date(),
  cancelReason: z.string(),
});

// Request params para list invoices
export const listInvoicesQuerySchema = z.object({
  status: invoiceStatusSchema.optional(),
  orderId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Response para list invoices
export const listInvoicesResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      orderId: z.string(),
      type: invoiceTypeSchema,
      number: z.string(),
      series: z.string(),
      accessKey: z.string(),
      status: invoiceStatusSchema,
      issuedAt: z.date().optional(),
      createdAt: z.date(),
    }),
  ),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  pages: z.number().int(),
});

// Request para configure Focus NFe
export const configureFocusNfeRequestSchema = z.object({
  apiKey: z.string().min(1),
  productionMode: z.boolean().default(false),
  autoIssueOnConfirm: z.boolean().default(true),
  defaultSeries: z.string().max(3).default('1'),
});

// Response para configure Focus NFe
export const configureFocusNfeResponseSchema = z.object({
  id: z.string(),
  configured: z.boolean(),
  message: z.string(),
  productionMode: z.boolean(),
  isEnabled: z.boolean(),
});
