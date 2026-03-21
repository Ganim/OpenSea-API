/**
 * Price Table Zod Schemas
 * Validation schemas for Price Table CRUD endpoints
 */

import { z } from 'zod';

// ─── Create Price Table ────────────────────────────────────────────────────────

export const createPriceTableSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(128)
    .describe('Name of the price table'),
  description: z
    .string()
    .max(500)
    .optional()
    .describe('Description of the price table'),
  type: z
    .enum(['DEFAULT', 'RETAIL', 'WHOLESALE', 'REGIONAL', 'CHANNEL', 'CUSTOMER', 'BID'])
    .optional()
    .default('DEFAULT')
    .describe('Type of the price table'),
  currency: z
    .string()
    .length(3)
    .optional()
    .default('BRL')
    .describe('Currency code (ISO 4217)'),
  priceIncludesTax: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether prices include tax'),
  isDefault: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether this is the default price table'),
  priority: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Priority for price resolution (higher wins)'),
  isActive: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether the price table is active'),
  validFrom: z.coerce
    .date()
    .optional()
    .describe('Start of validity period'),
  validUntil: z.coerce
    .date()
    .optional()
    .describe('End of validity period'),
});

// ─── Update Price Table ────────────────────────────────────────────────────────

export const updatePriceTableSchema = createPriceTableSchema
  .partial()
  .describe('Update price table fields (all optional)');

// ─── Price Table Response ──────────────────────────────────────────────────────

export const priceTableResponseSchema = z.object({
  id: z.string().uuid().describe('Unique price table ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  name: z.string().describe('Name'),
  description: z.string().nullable().describe('Description'),
  type: z.string().describe('Price table type'),
  currency: z.string().describe('Currency code'),
  priceIncludesTax: z.boolean().describe('Prices include tax'),
  isDefault: z.boolean().describe('Is default'),
  priority: z.number().describe('Priority'),
  isActive: z.boolean().describe('Is active'),
  validFrom: z.coerce.date().nullable().describe('Valid from'),
  validUntil: z.coerce.date().nullable().describe('Valid until'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().describe('Last update date'),
  deletedAt: z.coerce.date().nullable().describe('Deletion date'),
});

// ─── List Price Tables Query ───────────────────────────────────────────────────

export const listPriceTablesQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Page number (starts at 1)'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page (max 100)'),
  search: z
    .string()
    .max(200)
    .optional()
    .describe('Search by name or description'),
  type: z
    .enum(['DEFAULT', 'RETAIL', 'WHOLESALE', 'REGIONAL', 'CHANNEL', 'CUSTOMER', 'BID'])
    .optional()
    .describe('Filter by type'),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .describe('Filter by active status'),
  sortBy: z
    .enum(['name', 'type', 'priority', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});

// ─── Upsert Price Table Item ───────────────────────────────────────────────────

export const upsertPriceTableItemSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid().describe('Variant ID'),
        price: z.number().positive().describe('Unit price'),
        minQuantity: z
          .number()
          .int()
          .min(1)
          .optional()
          .default(1)
          .describe('Minimum quantity for this price tier'),
        maxQuantity: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('Maximum quantity for this price tier'),
        costPrice: z
          .number()
          .positive()
          .optional()
          .describe('Cost price'),
        marginPercent: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe('Margin percentage'),
      }),
    )
    .min(1)
    .describe('Price table items to upsert'),
});

export const priceTableItemResponseSchema = z.object({
  id: z.string().uuid().describe('Unique item ID'),
  priceTableId: z.string().uuid().describe('Price table ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  variantId: z.string().uuid().describe('Variant ID'),
  price: z.number().describe('Unit price'),
  minQuantity: z.number().describe('Min quantity'),
  maxQuantity: z.number().nullable().describe('Max quantity'),
  costPrice: z.number().nullable().describe('Cost price'),
  marginPercent: z.number().nullable().describe('Margin percent'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().describe('Last update date'),
});

// ─── List Price Table Items Query ──────────────────────────────────────────────

export const listPriceTableItemsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Page number'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page'),
  variantId: z
    .string()
    .uuid()
    .optional()
    .describe('Filter by variant ID'),
  sortBy: z
    .enum(['price', 'minQuantity', 'createdAt'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});

// ─── Resolve Price ─────────────────────────────────────────────────────────────

export const resolvePriceSchema = z.object({
  variantId: z.string().uuid().describe('Variant to resolve price for'),
  customerId: z.string().uuid().optional().describe('Customer ID for customer-specific pricing'),
  quantity: z.number().int().positive().optional().default(1).describe('Quantity for tiered pricing'),
  priceTableId: z.string().uuid().optional().describe('Specific price table to use'),
});

export const resolvePriceResponseSchema = z.object({
  variantId: z.string().uuid(),
  price: z.number(),
  source: z.string().describe('Price source: customer_price, price_table, default'),
  priceTableId: z.string().uuid().nullable(),
  priceTableName: z.string().nullable(),
  tiered: z.boolean(),
});
