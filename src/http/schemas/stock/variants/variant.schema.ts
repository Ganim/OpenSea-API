/**
 * VARIANT SCHEMAS
 */

import { z } from 'zod';

export const createVariantSchema = z.object({
  productId: z.uuid(),
  sku: z.string().min(1).max(100).optional(), // Agora opcional
  name: z.string().min(1).max(255),
  price: z.number().nonnegative().optional().default(0),
  attributes: z.record(z.string(), z.unknown()).optional(),
  costPrice: z.number().positive().optional(),
  profitMargin: z.number().optional(),
  barcode: z.string().max(100).optional(),
  qrCode: z.string().max(100).optional(),
  eanCode: z.string().max(100).optional(),
  upcCode: z.string().max(100).optional(),
  colorHex: z.string().max(7).optional(),
  colorPantone: z.string().max(50).optional(),
  secondaryColorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  secondaryColorPantone: z.string().max(32).optional(),
  pattern: z
    .enum(['SOLID', 'STRIPED', 'PLAID', 'PRINTED', 'GRADIENT', 'JACQUARD'])
    .optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(0).optional(),
  reference: z.string().max(128).optional(),
  similars: z.array(z.unknown()).optional(),
  outOfLine: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const variantResponseSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  sku: z.string().optional(),
  fullCode: z.string().optional(),
  sequentialCode: z.number().optional(),
  name: z.string(),
  price: z.number(),
  attributes: z.record(z.string(), z.unknown()),
  costPrice: z.number().optional(),
  profitMargin: z.number().optional(),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  eanCode: z.string().optional(),
  upcCode: z.string().optional(),
  colorHex: z.string().optional(),
  colorPantone: z.string().optional(),
  secondaryColorHex: z.string().nullable().optional(),
  secondaryColorPantone: z.string().nullable().optional(),
  pattern: z.string().nullable().optional(),
  minStock: z.number().optional(),
  maxStock: z.number().optional(),
  reorderPoint: z.number().optional(),
  reorderQuantity: z.number().optional(),
  reference: z.string().optional(),
  similars: z.array(z.unknown()).optional(),
  outOfLine: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional(),
});

export const variantWithAggregationsResponseSchema =
  variantResponseSchema.extend({
    productCode: z.string().nullable(),
    productName: z.string(),
    itemCount: z.number(),
    totalCurrentQuantity: z.number(),
  });

/**
 * Lightweight product info attached to a variant when the
 * `includeProduct=true` query flag is used on GET /v1/variants.
 * Provides enough metadata for mobile selectors to render
 * template/product/manufacturer labels without extra requests.
 */
export const variantProductInfoSchema = z.object({
  productId: z.uuid(),
  productName: z.string(),
  templateId: z.string().nullable(),
  templateName: z.string().nullable(),
  manufacturerId: z.string().nullable(),
  manufacturerName: z.string().nullable(),
});

export const variantWithProductResponseSchema = variantResponseSchema.extend({
  product: variantProductInfoSchema.optional(),
});

export const updateVariantSchema = createVariantSchema
  .partial()
  .omit({ productId: true });
