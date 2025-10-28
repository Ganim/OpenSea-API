/**
 * Sales Module Zod Schemas
 * Schemas reutilizáveis para clientes, pedidos, comentários, promoções, etc.
 */

import z from 'zod';

// ============= ENUMS =============

export const salesOrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
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
  name: z.string().min(1).max(255),
  email: z.email(),
  phone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
});

export const customerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ============= SALES ORDER SCHEMAS =============

export const salesOrderItemSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).max(100).optional().default(0),
});

export const createSalesOrderSchema = z.object({
  customerId: z.uuid(),
  orderNumber: z.string().min(1).max(100).optional(),
  status: salesOrderStatusEnum.optional().default('PENDING'),
  paymentMethod: paymentMethodEnum,
  paymentStatus: paymentStatusEnum.optional().default('PENDING'),
  deliveryMethod: deliveryMethodEnum,
  deliveryAddress: z.string().max(500).optional(),
  deliveryDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(salesOrderItemSchema).min(1),
});

export const salesOrderResponseSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  orderNumber: z.string(),
  status: z.string(),
  paymentMethod: z.string(),
  paymentStatus: z.string(),
  deliveryMethod: z.string(),
  deliveryAddress: z.string().optional(),
  deliveryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  subtotal: z.number(),
  discount: z.number(),
  total: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const updateSalesOrderStatusSchema = z.object({
  status: salesOrderStatusEnum,
});

export const updateSalesOrderPaymentSchema = z.object({
  paymentStatus: paymentStatusEnum,
});

// ============= COMMENT SCHEMAS =============

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  salesOrderId: z.uuid(),
  parentCommentId: z.uuid().optional(),
});

export const commentResponseSchema = z.object({
  id: z.uuid(),
  content: z.string(),
  salesOrderId: z.uuid(),
  parentCommentId: z.uuid().optional(),
  userId: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// ============= VARIANT PROMOTION SCHEMAS =============

export const createVariantPromotionSchema = z.object({
  variantId: z.uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  discountAmount: z.number().positive().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional().default(true),
});

export const variantPromotionResponseSchema = z.object({
  id: z.uuid(),
  variantId: z.uuid(),
  name: z.string(),
  description: z.string().optional(),
  discountPercentage: z.number().optional(),
  discountAmount: z.number().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateVariantPromotionSchema = createVariantPromotionSchema
  .partial()
  .omit({ variantId: true });

// ============= ITEM RESERVATION SCHEMAS =============

export const createItemReservationSchema = z.object({
  itemId: z.uuid(),
  customerId: z.uuid(),
  quantity: z.number().int().positive(),
  reservationDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

export const itemReservationResponseSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
  customerId: z.uuid(),
  quantity: z.number(),
  reservationDate: z.coerce.date(),
  expirationDate: z.coerce.date(),
  notes: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const updateItemReservationSchema = createItemReservationSchema
  .partial()
  .omit({ itemId: true, customerId: true });

export const cancelItemReservationSchema = z.object({
  reason: z.string().max(500).optional(),
});

// ============= NOTIFICATION PREFERENCE SCHEMAS =============

export const createNotificationPreferenceSchema = z.object({
  userId: z.uuid(),
  emailEnabled: z.boolean().optional().default(true),
  smsEnabled: z.boolean().optional().default(false),
  pushEnabled: z.boolean().optional().default(true),
  orderUpdates: z.boolean().optional().default(true),
  promotions: z.boolean().optional().default(true),
  newsletter: z.boolean().optional().default(false),
});

export const notificationPreferenceResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  orderUpdates: z.boolean(),
  promotions: z.boolean(),
  newsletter: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateNotificationPreferenceSchema =
  createNotificationPreferenceSchema.partial().omit({ userId: true });

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
