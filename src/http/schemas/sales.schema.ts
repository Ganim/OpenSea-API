/**
 * Sales Module Zod Schemas
 * Schemas reutilizáveis para clientes, pedidos, comentários, promoções, etc.
 */

import z from 'zod';

// ============= ENUMS =============

export const salesOrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);

// Enum específico para criação de pedidos (apenas status iniciais válidos)
export const createSalesOrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'CONFIRMED',
]);

export const paymentMethodEnum = z.enum([
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PIX',
  'BOLETO',
  'CASH',
  'TRANSFER',
]);

export const paymentStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
]);

export const deliveryMethodEnum = z.enum(['PICKUP', 'DELIVERY', 'SHIPPING']);

// ============= CUSTOMER SCHEMAS =============

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(128),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']),
  document: z.string().optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(256).optional(),
  city: z.string().max(128).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().max(10).optional(),
  country: z.string().max(64).optional(),
  notes: z.string().optional(),
});

export const customerResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  document: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .omit({ type: true });

// SalesOrderItem schema

// ============= SALES ORDER SCHEMAS =============

export const salesOrderItemResponseSchema = z.object({
  id: z.string().uuid(),
  // orderId: z.string().uuid(), // removed - not returned by use-case
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  discount: z.number(),
  totalPrice: z.number(),
  notes: z.string().nullable().optional(),
  // createdAt: z.coerce.date(), // removed - not returned by use-case
  // updatedAt: z.coerce.date().optional(), // removed - not returned by use-case
});

export const salesOrderItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().max(1000).optional(),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid(),
  orderNumber: z.string().min(1).max(100),
  status: createSalesOrderStatusEnum.optional().default('PENDING'),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().max(1000).optional(),
  items: z.array(salesOrderItemSchema).min(1),
  createdBy: z.string().uuid().optional(),
});

export const salesOrderResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  customerId: z.string().uuid(),
  createdBy: z.string().uuid().nullable().optional(),
  status: z.string(),
  totalPrice: z.number(),
  discount: z.number(),
  finalPrice: z.number(),
  notes: z.string().nullable().optional(),
  items: z.array(salesOrderItemResponseSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateSalesOrderStatusSchema = z.object({
  status: salesOrderStatusEnum,
});

// ============= COMMENT SCHEMAS =============

export const createCommentSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
});

export const commentResponseSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  parentCommentId: z.string().uuid().optional(),
  isDeleted: z.boolean(),
  isEdited: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ============= VARIANT PROMOTION SCHEMAS =============

export const createVariantPromotionSchema = z.object({
  variantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().max(1000).optional(),
});

export const variantPromotionResponseSchema = z.object({
  id: z.string().uuid(),
  variantId: z.string().uuid(),
  name: z.string(),
  discountType: z.string(),
  discountValue: z.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean(),
  isCurrentlyValid: z.boolean(),
  isExpired: z.boolean(),
  isUpcoming: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const updateVariantPromotionSchema = createVariantPromotionSchema
  .partial()
  .omit({ variantId: true });

// ============= ITEM RESERVATION SCHEMAS =============

export const createItemReservationSchema = z.object({
  itemId: z.string().uuid(),
  userId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.string().max(500).optional(),
  reference: z.string().max(255).optional(),
  expiresAt: z.coerce.date(),
});

export const itemReservationResponseSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  userId: z.string().uuid(),
  quantity: z.number(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  expiresAt: z.coerce.date(),
  releasedAt: z.coerce.date().optional(),
  isExpired: z.boolean(),
  isReleased: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
});

// ============= NOTIFICATION PREFERENCE SCHEMAS =============

export const createNotificationPreferenceSchema = z.object({
  userId: z.string().uuid(),
  alertType: z.enum([
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'EXPIRING_SOON',
    'EXPIRED',
    'PRICE_CHANGE',
    'REORDER_POINT',
  ]),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']),
  isEnabled: z.boolean().optional().default(true),
});

export const notificationPreferenceResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  alertType: z.string(),
  channel: z.string(),
  isEnabled: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateNotificationPreferenceSchema = z.object({
  isEnabled: z.boolean().optional(),
});

// ============= QUERY PARAMS =============

export const salesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
