/**
 * Customer Price Zod Schemas
 * Validation schemas for Customer-specific pricing endpoints
 */

import { z } from 'zod';

// ─── Create Customer Price ─────────────────────────────────────────────────────

export const createCustomerPriceSchema = z.object({
  customerId: z.string().uuid().describe('UUID of the customer'),
  variantId: z.string().uuid().describe('UUID of the variant'),
  price: z.number().positive().describe('Negotiated price'),
  validFrom: z.coerce.date().optional().describe('Start of validity period'),
  validUntil: z.coerce.date().optional().describe('End of validity period'),
  notes: z
    .string()
    .max(500)
    .optional()
    .describe('Notes about this pricing agreement'),
});

// ─── Update Customer Price ─────────────────────────────────────────────────────

export const updateCustomerPriceSchema = createCustomerPriceSchema
  .omit({ customerId: true, variantId: true })
  .partial()
  .describe('Update customer price fields (all optional)');

// ─── Customer Price Response ───────────────────────────────────────────────────

export const customerPriceResponseSchema = z.object({
  id: z.string().uuid().describe('Unique customer price ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  customerId: z.string().uuid().describe('Customer ID'),
  variantId: z.string().uuid().describe('Variant ID'),
  price: z.number().describe('Negotiated price'),
  validFrom: z.coerce.date().nullable().describe('Valid from'),
  validUntil: z.coerce.date().nullable().describe('Valid until'),
  notes: z.string().nullable().describe('Notes'),
  createdByUserId: z.string().uuid().describe('Created by user ID'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().describe('Last update date'),
});

// ─── List Customer Prices Query ────────────────────────────────────────────────

export const listCustomerPricesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('Page number'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page'),
  customerId: z.string().uuid().optional().describe('Filter by customer ID'),
  variantId: z.string().uuid().optional().describe('Filter by variant ID'),
  sortBy: z
    .enum(['price', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});
