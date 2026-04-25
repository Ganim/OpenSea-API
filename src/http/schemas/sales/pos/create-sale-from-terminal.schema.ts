import { z } from 'zod';

/**
 * Request / response schemas for `POST /v1/pos/sales` (Emporion Plan A —
 * Task 28). The endpoint is device-authenticated (no JWT/RBAC) and
 * idempotent on the `Idempotency-Key` header — the body cart, payments and
 * customer data are only consumed when the key has not been seen before.
 */

const cartLineSchema = z.object({
  itemId: z.string().uuid(),
  variantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  sku: z.string().max(120).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discountValue: z.number().nonnegative().optional(),
});

const paymentSchema = z.object({
  method: z.string().min(1).max(40),
  amount: z.number().nonnegative(),
  reference: z.string().max(255).nullable().optional(),
});

const customerDataSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('EXISTING'),
    customerId: z.string().uuid(),
  }),
  z.object({
    kind: z.literal('CPF_ONLY'),
    cpf: z.string().min(11).max(14),
  }),
  z.object({
    kind: z.literal('ANONYMOUS'),
  }),
]);

export const createSaleFromTerminalBodySchema = z.object({
  sessionId: z.string().uuid(),
  operatorEmployeeId: z.string().uuid(),
  cart: z.array(cartLineSchema).min(1),
  payments: z.array(paymentSchema),
  customerData: customerDataSchema,
  createdAt: z.coerce.date(),
});

const orderResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  orderNumber: z.string(),
  type: z.string(),
  customerId: z.string(),
  contactId: z.string().nullable(),
  pipelineId: z.string(),
  stageId: z.string(),
  channel: z.string(),
  subtotal: z.number(),
  discountTotal: z.number(),
  taxTotal: z.number(),
  shippingTotal: z.number(),
  grandTotal: z.number(),
  currency: z.string(),
  priceTableId: z.string().nullable(),
  paymentConditionId: z.string().nullable(),
  creditUsed: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  deliveryMethod: z.string().nullable(),
  needsApproval: z.boolean(),
  assignedToUserId: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  stageEnteredAt: z.date(),
  confirmedAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  cancelReason: z.string().nullable(),
  expiresAt: z.date().nullable(),
  originSource: z.enum(['WEB', 'POS_DESKTOP', 'API', 'MOBILE']),
  posTerminalId: z.string().nullable(),
  posSessionId: z.string().nullable(),
  posOperatorEmployeeId: z.string().nullable(),
  saleLocalUuid: z.string().nullable(),
  ackReceivedAt: z.date().nullable(),
  fiscalDocumentType: z.enum(['NFE', 'NFC_E', 'SAT_CFE', 'MFE']).nullable(),
  fiscalDocumentNumber: z.number().nullable(),
  fiscalAccessKey: z.string().nullable(),
  fiscalAuthorizationProtocol: z.string().nullable(),
  fiscalEmittedAt: z.date().nullable(),
  fiscalEmissionStatus: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

const conflictDetailSchema = z.object({
  itemId: z.string(),
  variantId: z.string(),
  requestedQuantity: z.number(),
  availableQuantity: z.number(),
  shortage: z.number(),
  reason: z.enum([
    'INSUFFICIENT_STOCK',
    'FRACTIONAL_NOT_ALLOWED',
    'BELOW_MIN_FRACTIONAL_SALE',
    'ITEM_NOT_FOUND',
  ]),
});

export const createSaleFromTerminalSuccessResponseSchema = z.object({
  status: z.enum(['confirmed', 'already_synced']),
  order: orderResponseSchema,
});

export const createSaleFromTerminalConflictResponseSchema = z.object({
  status: z.literal('conflict'),
  conflictId: z.string(),
  conflicts: z.array(conflictDetailSchema),
});

export type CreateSaleFromTerminalBody = z.infer<
  typeof createSaleFromTerminalBodySchema
>;
