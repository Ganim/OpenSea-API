/**
 * Campaign Zod Schemas
 * Validation schemas for Campaign CRUD endpoints
 */

import { z } from 'zod';

// ─── Create Campaign ───────────────────────────────────────────────────────────

export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(128)
    .describe('Campaign name'),
  description: z
    .string()
    .max(500)
    .optional()
    .describe('Campaign description'),
  type: z
    .enum([
      'PERCENTAGE',
      'FIXED_VALUE',
      'BUY_X_GET_Y',
      'BUY_X_GET_DISCOUNT',
      'FREE_SHIPPING',
      'BUNDLE_PRICE',
    ])
    .describe('Campaign type'),
  startDate: z.coerce
    .date()
    .describe('Campaign start date'),
  endDate: z.coerce
    .date()
    .describe('Campaign end date'),
  channels: z
    .array(z.string().max(50))
    .optional()
    .default([])
    .describe('Distribution channels'),
  targetAudience: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Target audience JSON'),
  priority: z
    .number()
    .int()
    .min(0)
    .optional()
    .default(0)
    .describe('Campaign priority'),
  stackable: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether campaign can stack with others'),
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
    .describe('Maximum usages per customer'),
  rules: z
    .array(
      z.object({
        ruleType: z.enum([
          'MIN_QUANTITY',
          'MIN_VALUE',
          'PRODUCT_CATEGORY',
          'CUSTOMER_TAG',
          'CUSTOMER_TYPE',
          'FIRST_PURCHASE',
          'DAY_OF_WEEK',
          'TIME_RANGE',
        ]),
        operator: z.enum(['EQUALS', 'IN', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN']),
        value: z.string().max(500),
        value2: z.string().max(500).optional(),
      }),
    )
    .optional()
    .describe('Campaign eligibility rules'),
  products: z
    .array(
      z.object({
        variantId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        discountType: z.enum(['PERCENTAGE', 'FIXED_VALUE', 'FIXED_PRICE', 'FREE']),
        discountValue: z.number().min(0),
        maxDiscount: z.number().positive().optional(),
      }),
    )
    .optional()
    .describe('Campaign product discounts'),
});

// ─── Update Campaign ───────────────────────────────────────────────────────────

export const updateCampaignSchema = createCampaignSchema
  .partial()
  .describe('Update campaign fields (all optional)');

// ─── Campaign Response ─────────────────────────────────────────────────────────

export const campaignResponseSchema = z.object({
  id: z.string().uuid().describe('Unique campaign ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  name: z.string().describe('Campaign name'),
  description: z.string().nullable().describe('Description'),
  type: z.string().describe('Campaign type'),
  status: z.string().describe('Campaign status'),
  startDate: z.coerce.date().describe('Start date'),
  endDate: z.coerce.date().describe('End date'),
  channels: z.array(z.string()).describe('Channels'),
  targetAudience: z.record(z.string(), z.unknown()).nullable().describe('Target audience'),
  priority: z.number().describe('Priority'),
  stackable: z.boolean().describe('Is stackable'),
  maxUsageTotal: z.number().nullable().describe('Max total usage'),
  maxUsagePerCustomer: z.number().nullable().describe('Max per customer'),
  usageCount: z.number().describe('Current usage count'),
  aiGenerated: z.boolean().describe('AI generated'),
  aiReason: z.string().nullable().describe('AI reason'),
  createdByUserId: z.string().uuid().describe('Created by'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().describe('Last update date'),
  deletedAt: z.coerce.date().nullable().describe('Deletion date'),
});

// ─── List Campaigns Query ──────────────────────────────────────────────────────

export const listCampaignsQuerySchema = z.object({
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
    .describe('Search by name'),
  type: z
    .enum([
      'PERCENTAGE',
      'FIXED_VALUE',
      'BUY_X_GET_Y',
      'BUY_X_GET_DISCOUNT',
      'FREE_SHIPPING',
      'BUNDLE_PRICE',
    ])
    .optional()
    .describe('Filter by type'),
  status: z
    .enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED'])
    .optional()
    .describe('Filter by status'),
  sortBy: z
    .enum(['name', 'type', 'status', 'startDate', 'endDate', 'createdAt'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});
