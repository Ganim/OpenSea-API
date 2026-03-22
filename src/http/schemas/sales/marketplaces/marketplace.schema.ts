import z from 'zod';

// ─── Enums ──────────────────────────────────────────────────────────────────────

export const MarketplacePlatformEnum = z.enum([
  'MERCADO_LIVRE',
  'SHOPEE',
  'AMAZON',
  'MAGALU',
  'AMERICANAS',
  'SHEIN',
  'OTHER',
]);

export const ConnectionStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'ERROR',
]);

export const ListingStatusEnum = z.enum([
  'ACTIVE',
  'PAUSED',
  'CLOSED',
  'ERROR',
  'PENDING',
]);

export const MarketplaceOrderStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'INVOICED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);

export const PaymentStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REFUNDED',
  'CHARGEBACK',
  'CANCELLED',
]);

// ─── Connection Schemas ─────────────────────────────────────────────────────────

export const createConnectionSchema = z.object({
  platform: MarketplacePlatformEnum,
  name: z.string().min(1).max(120),
  sellerId: z.string().min(1).max(255).optional(),
  accessToken: z.string().min(1).optional(),
  refreshToken: z.string().min(1).optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  autoSync: z.boolean().optional().default(true),
  syncIntervalMinutes: z.coerce
    .number()
    .int()
    .min(5)
    .max(1440)
    .optional()
    .default(30),
});

export const updateConnectionSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  sellerId: z.string().min(1).max(255).optional(),
  accessToken: z.string().min(1).optional(),
  refreshToken: z.string().min(1).optional(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  autoSync: z.boolean().optional(),
  syncIntervalMinutes: z.coerce.number().int().min(5).max(1440).optional(),
  status: ConnectionStatusEnum.optional(),
});

export const connectionResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  platform: MarketplacePlatformEnum,
  name: z.string(),
  sellerId: z.string().nullable(),
  status: ConnectionStatusEnum,
  autoSync: z.boolean(),
  syncIntervalMinutes: z.number(),
  lastSyncAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listConnectionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  platform: MarketplacePlatformEnum.optional(),
  status: ConnectionStatusEnum.optional(),
  sortBy: z
    .enum(['name', 'platform', 'status', 'createdAt', 'lastSyncAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ─── Listing Schemas ────────────────────────────────────────────────────────────

export const publishListingSchema = z.object({
  variantId: z.string().uuid(),
  externalCategoryId: z.string().min(1).optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().positive(),
  promotionalPrice: z.coerce.number().positive().optional(),
  quantity: z.coerce.number().int().min(0),
  currencyCode: z.string().length(3).optional().default('BRL'),
  shippingType: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
});

export const listingResponseSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  variantId: z.string().uuid(),
  externalId: z.string().nullable(),
  externalCategoryId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  promotionalPrice: z.number().nullable(),
  quantity: z.number(),
  currencyCode: z.string(),
  status: ListingStatusEnum,
  externalUrl: z.string().nullable(),
  lastSyncAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listListingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: ListingStatusEnum.optional(),
  variantId: z.string().uuid().optional(),
  sortBy: z
    .enum(['title', 'price', 'status', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ─── Order Schemas ──────────────────────────────────────────────────────────────

export const marketplaceOrderResponseSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  externalId: z.string(),
  status: MarketplaceOrderStatusEnum,
  buyerName: z.string().nullable(),
  buyerDocument: z.string().nullable(),
  totalAmount: z.number(),
  currencyCode: z.string(),
  shippingCost: z.number().nullable(),
  platformFee: z.number().nullable(),
  items: z.array(
    z.object({
      externalId: z.string(),
      title: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      variantId: z.string().uuid().nullable(),
    }),
  ),
  acknowledgedAt: z.string().datetime().nullable(),
  shippedAt: z.string().datetime().nullable(),
  deliveredAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listMarketplaceOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: MarketplaceOrderStatusEnum.optional(),
  sortBy: z
    .enum(['totalAmount', 'status', 'createdAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ─── Payment Schemas ────────────────────────────────────────────────────────────

export const marketplacePaymentResponseSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  orderId: z.string().uuid().nullable(),
  externalId: z.string(),
  status: PaymentStatusEnum,
  grossAmount: z.number(),
  netAmount: z.number(),
  platformFee: z.number(),
  currencyCode: z.string(),
  paidAt: z.string().datetime().nullable(),
  availableAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: PaymentStatusEnum.optional(),
  sortBy: z
    .enum(['grossAmount', 'netAmount', 'status', 'createdAt', 'paidAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const reconciliationResponseSchema = z.object({
  connectionId: z.string().uuid(),
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  totalOrders: z.number(),
  totalGross: z.number(),
  totalFees: z.number(),
  totalNet: z.number(),
  pendingPayments: z.number(),
  reconciledPayments: z.number(),
  currencyCode: z.string(),
});

export const reconciliationQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
