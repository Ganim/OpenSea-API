import { z } from 'zod';

// Enums
export const orderTypeEnum = z.enum(['QUOTE', 'ORDER']);
export const orderChannelEnum = z.enum([
  'PDV',
  'WEB',
  'WHATSAPP',
  'MARKETPLACE',
  'BID',
  'MANUAL',
  'API',
]);
export const deliveryMethodEnum = z.enum([
  'PICKUP',
  'OWN_FLEET',
  'CARRIER',
  'PARTIAL',
]);
export const returnTypeEnum = z.enum([
  'FULL_RETURN',
  'PARTIAL_RETURN',
  'EXCHANGE',
]);
export const returnReasonEnum = z.enum([
  'DEFECTIVE',
  'WRONG_ITEM',
  'CHANGED_MIND',
  'DAMAGED',
  'NOT_AS_DESCRIBED',
  'OTHER',
]);
export const returnStatusEnum = z.enum([
  'REQUESTED',
  'APPROVED',
  'RECEIVING',
  'RECEIVED',
  'CREDIT_ISSUED',
  'EXCHANGE_COMPLETED',
  'REJECTED',
  'CANCELLED',
]);
export const refundMethodEnum = z.enum([
  'SAME_METHOD',
  'STORE_CREDIT',
  'BANK_TRANSFER',
  'PIX',
]);
export const paymentConditionTypeEnum = z.enum([
  'CASH',
  'INSTALLMENT',
  'CUSTOM',
  'CREDIT_LIMIT',
]);
export const interestTypeEnum = z.enum(['SIMPLE', 'COMPOUND']);
export const applicableToEnum = z.enum(['ALL', 'RETAIL', 'WHOLESALE', 'BID']);
export const storeCreditSourceEnum = z.enum([
  'RETURN',
  'MANUAL',
  'CAMPAIGN',
  'LOYALTY',
]);

// --- Order Schemas ---

export const createOrderItemSchema = z.object({
  variantId: z.string().uuid().optional(),
  name: z.string().min(1).max(256),
  sku: z.string().max(64).optional(),
  description: z.string().max(1000).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).optional(),
  discountValue: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const createOrderSchema = z.object({
  type: orderTypeEnum,
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  channel: orderChannelEnum,
  subtotal: z.number().min(0),
  discountTotal: z.number().min(0).optional(),
  taxTotal: z.number().min(0).optional(),
  shippingTotal: z.number().min(0).optional(),
  currency: z.string().max(3).optional(),
  priceTableId: z.string().uuid().optional(),
  paymentConditionId: z.string().uuid().optional(),
  deliveryMethod: deliveryMethodEnum.optional(),
  deliveryAddress: z.record(z.string(), z.unknown()).optional(),
  sourceWarehouseId: z.string().uuid().optional(),
  assignedToUserId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
  items: z.array(createOrderItemSchema).min(1),
});

export const updateOrderSchema = z.object({
  contactId: z.string().uuid().nullable().optional(),
  paymentConditionId: z.string().uuid().nullable().optional(),
  deliveryMethod: deliveryMethodEnum.optional(),
  deliveryAddress: z.record(z.string(), z.unknown()).optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  discountTotal: z.number().min(0).optional(),
  taxTotal: z.number().min(0).optional(),
  shippingTotal: z.number().min(0).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const changeOrderStageSchema = z.object({
  stageId: z.string().uuid(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(1000).optional(),
});

// --- Order Item Response ---

export const orderItemResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  comboId: z.string().uuid().nullable(),
  name: z.string(),
  sku: z.string().nullable(),
  description: z.string().nullable(),
  quantity: z.number(),
  unitPrice: z.number(),
  discountPercent: z.number(),
  discountValue: z.number(),
  subtotal: z.number(),
  taxTotal: z.number(),
  quantityDelivered: z.number(),
  quantityReturned: z.number(),
  priceSource: z.string(),
  position: z.number(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// --- Order Response ---

export const orderResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  orderNumber: z.string(),
  type: z.string(),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().nullable(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  channel: z.string(),
  subtotal: z.number(),
  discountTotal: z.number(),
  taxTotal: z.number(),
  shippingTotal: z.number(),
  grandTotal: z.number(),
  currency: z.string(),
  priceTableId: z.string().uuid().nullable(),
  paymentConditionId: z.string().uuid().nullable(),
  creditUsed: z.number(),
  paidAmount: z.number(),
  remainingAmount: z.number(),
  deliveryMethod: z.string().nullable(),
  needsApproval: z.boolean(),
  assignedToUserId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  stageEnteredAt: z.coerce.date(),
  confirmedAt: z.coerce.date().nullable(),
  cancelledAt: z.coerce.date().nullable(),
  cancelReason: z.string().nullable(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// --- Payment Condition Schemas ---

export const createPaymentConditionSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  type: paymentConditionTypeEnum,
  installments: z.number().int().min(1).optional(),
  firstDueDays: z.number().int().min(0).optional(),
  intervalDays: z.number().int().min(0).optional(),
  downPaymentPercent: z.number().min(0).max(100).optional(),
  interestRate: z.number().min(0).optional(),
  interestType: interestTypeEnum.optional(),
  penaltyRate: z.number().min(0).optional(),
  discountCash: z.number().min(0).optional(),
  applicableTo: applicableToEnum.optional(),
  minOrderValue: z.number().min(0).optional(),
  maxOrderValue: z.number().min(0).optional(),
  isDefault: z.boolean().optional(),
});

export const updatePaymentConditionSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional(),
  installments: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const paymentConditionResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  installments: z.number(),
  firstDueDays: z.number(),
  intervalDays: z.number(),
  downPaymentPercent: z.number().nullable(),
  interestRate: z.number().nullable(),
  interestType: z.string(),
  penaltyRate: z.number().nullable(),
  discountCash: z.number().nullable(),
  applicableTo: z.string(),
  minOrderValue: z.number().nullable(),
  maxOrderValue: z.number().nullable(),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// --- Order Return Schemas ---

export const createReturnSchema = z.object({
  orderId: z.string().uuid(),
  type: returnTypeEnum,
  reason: returnReasonEnum,
  reasonDetails: z.string().max(1000).optional(),
  refundMethod: refundMethodEnum.optional(),
  refundAmount: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const orderReturnResponseSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  returnNumber: z.string(),
  type: z.string(),
  status: z.string(),
  reason: z.string(),
  reasonDetails: z.string().nullable(),
  refundMethod: z.string().nullable(),
  refundAmount: z.number(),
  creditAmount: z.number(),
  exchangeOrderId: z.string().uuid().nullable(),
  requestedByUserId: z.string().uuid(),
  approvedByUserId: z.string().uuid().nullable(),
  approvedAt: z.coerce.date().nullable(),
  rejectedReason: z.string().nullable(),
  receivedAt: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// --- Store Credit Schemas ---

export const createStoreCreditSchema = z.object({
  customerId: z.string().uuid(),
  amount: z.number().positive(),
  expiresAt: z.string().datetime().optional(),
});

export const storeCreditBalanceResponseSchema = z.object({
  balance: z.number(),
});
