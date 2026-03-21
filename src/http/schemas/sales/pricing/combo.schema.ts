/**
 * Combo Zod Schemas
 * Validation schemas for Combo CRUD endpoints
 */

import { z } from 'zod';

// ─── Create Combo ──────────────────────────────────────────────────────────────

export const createComboSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(128)
    .describe('Combo name'),
  description: z
    .string()
    .max(500)
    .optional()
    .describe('Combo description'),
  type: z
    .enum(['FIXED', 'DYNAMIC'])
    .optional()
    .default('FIXED')
    .describe('Combo type'),
  fixedPrice: z
    .number()
    .positive()
    .optional()
    .describe('Fixed combo price (for FIXED type)'),
  discountType: z
    .enum(['PERCENTAGE', 'FIXED_VALUE'])
    .optional()
    .describe('Discount type (for DYNAMIC type)'),
  discountValue: z
    .number()
    .positive()
    .optional()
    .describe('Discount value'),
  minItems: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Minimum items in combo'),
  maxItems: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Maximum items in combo'),
  isActive: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether the combo is active'),
  validFrom: z.coerce
    .date()
    .optional()
    .describe('Start of validity'),
  validUntil: z.coerce
    .date()
    .optional()
    .describe('End of validity'),
  imageUrl: z
    .string()
    .url()
    .max(512)
    .optional()
    .describe('Combo image URL'),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid().optional().describe('Variant ID'),
        categoryId: z.string().uuid().optional().describe('Category ID'),
        quantity: z.number().positive().optional().default(1).describe('Quantity'),
        isRequired: z.boolean().optional().default(true).describe('Is required'),
        position: z.number().int().min(0).optional().default(0).describe('Display position'),
      }),
    )
    .optional()
    .describe('Combo items'),
});

// ─── Combo Response ────────────────────────────────────────────────────────────

export const comboResponseSchema = z.object({
  id: z.string().uuid().describe('Unique combo ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  name: z.string().describe('Combo name'),
  description: z.string().nullable().describe('Description'),
  type: z.string().describe('Combo type'),
  fixedPrice: z.number().nullable().describe('Fixed price'),
  discountType: z.string().nullable().describe('Discount type'),
  discountValue: z.number().nullable().describe('Discount value'),
  minItems: z.number().nullable().describe('Min items'),
  maxItems: z.number().nullable().describe('Max items'),
  isActive: z.boolean().describe('Is active'),
  validFrom: z.coerce.date().nullable().describe('Valid from'),
  validUntil: z.coerce.date().nullable().describe('Valid until'),
  imageUrl: z.string().nullable().describe('Image URL'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().describe('Last update date'),
  deletedAt: z.coerce.date().nullable().describe('Deletion date'),
});

// ─── List Combos Query ─────────────────────────────────────────────────────────

export const listCombosQuerySchema = z.object({
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
    .enum(['FIXED', 'DYNAMIC'])
    .optional()
    .describe('Filter by type'),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .describe('Filter by active status'),
  sortBy: z
    .enum(['name', 'type', 'fixedPrice', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});
