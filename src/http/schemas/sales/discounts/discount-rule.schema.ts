import { z } from 'zod';

export const discountRuleResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  value: z.number(),
  minOrderValue: z.number().optional(),
  minQuantity: z.number().optional(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  customerId: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean(),
  priority: z.number(),
  isStackable: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const createDiscountRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).optional(),
  minQuantity: z.number().int().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  isStackable: z.boolean().optional(),
});

export const updateDiscountRuleSchema = createDiscountRuleSchema.partial();

export const validateDiscountSchema = z.object({
  customerId: z.string().uuid().optional(),
  cartItems: z
    .array(
      z.object({
        productId: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1),
});

export const applicableDiscountSchema = z.object({
  ruleId: z.string().uuid(),
  ruleName: z.string(),
  type: z.string(),
  value: z.number(),
  calculatedDiscount: z.number(),
});
