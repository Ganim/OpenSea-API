/**
 * Coupon Zod Schemas
 * Validation schemas for Coupon CRUD endpoints
 */

import { z } from 'zod';

// ─── Create Coupon ─────────────────────────────────────────────────────────────

export const createCouponSchema = z.object({
  campaignId: z
    .string()
    .uuid()
    .optional()
    .describe('Optional campaign association'),
  code: z
    .string()
    .min(1)
    .max(64)
    .describe('Coupon code'),
  type: z
    .enum(['PERCENTAGE', 'FIXED_VALUE', 'FREE_SHIPPING'])
    .describe('Coupon discount type'),
  value: z
    .number()
    .positive()
    .describe('Discount value'),
  minOrderValue: z
    .number()
    .positive()
    .optional()
    .describe('Minimum order value to apply coupon'),
  maxDiscount: z
    .number()
    .positive()
    .optional()
    .describe('Maximum discount cap'),
  maxUsageTotal: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Maximum total usages'),
  maxUsagePerCustomer: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .describe('Maximum usages per customer'),
  validFrom: z.coerce
    .date()
    .describe('Start of validity'),
  validUntil: z.coerce
    .date()
    .describe('End of validity'),
  isActive: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether the coupon is active'),
  applicableTo: z
    .enum(['ALL', 'SPECIFIC_PRODUCTS', 'SPECIFIC_CATEGORIES', 'SPECIFIC_CUSTOMERS'])
    .optional()
    .default('ALL')
    .describe('Who the coupon applies to'),
  targetIds: z
    .array(z.string().uuid())
    .optional()
    .default([])
    .describe('Target entity IDs based on applicableTo'),
  customerId: z
    .string()
    .uuid()
    .optional()
    .describe('Specific customer restriction'),
});

// ─── Coupon Response ───────────────────────────────────────────────────────────

export const couponResponseSchema = z.object({
  id: z.string().uuid().describe('Unique coupon ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  campaignId: z.string().uuid().nullable().describe('Campaign ID'),
  code: z.string().describe('Coupon code'),
  type: z.string().describe('Discount type'),
  value: z.number().describe('Discount value'),
  minOrderValue: z.number().nullable().describe('Min order value'),
  maxDiscount: z.number().nullable().describe('Max discount'),
  maxUsageTotal: z.number().nullable().describe('Max total usage'),
  maxUsagePerCustomer: z.number().describe('Max per customer'),
  usageCount: z.number().describe('Current usage count'),
  validFrom: z.coerce.date().describe('Valid from'),
  validUntil: z.coerce.date().describe('Valid until'),
  isActive: z.boolean().describe('Is active'),
  applicableTo: z.string().describe('Applicable to'),
  targetIds: z.array(z.string()).describe('Target IDs'),
  aiGenerated: z.boolean().describe('AI generated'),
  aiReason: z.string().nullable().describe('AI reason'),
  customerId: z.string().uuid().nullable().describe('Customer ID'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().describe('Last update date'),
});

// ─── List Coupons Query ────────────────────────────────────────────────────────

export const listCouponsQuerySchema = z.object({
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
  search: z
    .string()
    .max(200)
    .optional()
    .describe('Search by code'),
  type: z
    .enum(['PERCENTAGE', 'FIXED_VALUE', 'FREE_SHIPPING'])
    .optional()
    .describe('Filter by type'),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .describe('Filter by active status'),
  campaignId: z
    .string()
    .uuid()
    .optional()
    .describe('Filter by campaign'),
  sortBy: z
    .enum(['code', 'type', 'value', 'validFrom', 'validUntil', 'createdAt'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});

// ─── Validate Coupon ───────────────────────────────────────────────────────────

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(64).describe('Coupon code to validate'),
  orderValue: z.number().positive().optional().describe('Order value for validation'),
  variantIds: z.array(z.string().uuid()).optional().describe('Variant IDs in the order'),
});

export const validateCouponResponseSchema = z.object({
  valid: z.boolean().describe('Whether the coupon is valid'),
  coupon: couponResponseSchema.optional().describe('Coupon details if valid'),
  reason: z.string().optional().describe('Reason if invalid'),
  discountAmount: z.number().optional().describe('Calculated discount amount'),
});
