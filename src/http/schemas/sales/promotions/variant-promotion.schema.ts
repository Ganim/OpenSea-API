/**
 * VARIANT PROMOTION SCHEMAS
 */

import { z } from 'zod';

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
