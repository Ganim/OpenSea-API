import z from 'zod';
import {
  createOffsetPaginatedResponseSchema,
  offsetPaginationSchema,
} from '../pagination.schema';

// --- Create PIX Charge ---

export const createPixChargeBodySchema = z.object({
  amount: z.number().positive().describe('Charge amount in BRL'),
  description: z
    .string()
    .max(140)
    .optional()
    .describe('Description shown to the payer'),
  orderId: z.string().uuid().optional().describe('Associated sales order ID'),
  posTransactionPaymentId: z
    .string()
    .uuid()
    .optional()
    .describe('Associated POS transaction payment ID'),
});

export const pixChargeResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  txId: z.string(),
  location: z.string(),
  pixCopiaECola: z.string(),
  amount: z.number(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED']),
  payerName: z.string().nullable(),
  payerCpfCnpj: z.string().nullable(),
  endToEndId: z.string().nullable(),
  posTransactionPaymentId: z.string().nullable(),
  orderId: z.string().nullable(),
  expiresAt: z.string().datetime(),
  paidAt: z.string().datetime().nullable(),
  provider: z.string(),
  createdAt: z.string().datetime(),
});

export const createPixChargeResponseSchema = z.object({
  pixCharge: pixChargeResponseSchema,
});

// --- List PIX Charges ---

export const listPixChargesQuerySchema = offsetPaginationSchema.extend({
  status: z
    .enum(['ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED'])
    .optional()
    .describe('Filter by charge status'),
});

export const listPixChargesResponseSchema = createOffsetPaginatedResponseSchema(
  pixChargeResponseSchema,
);

// --- PIX Webhook ---

export const pixWebhookBodySchema = z
  .any()
  .describe('Raw webhook payload from the PIX provider');

export const pixWebhookResponseSchema = z.object({
  acknowledged: z.boolean(),
});
