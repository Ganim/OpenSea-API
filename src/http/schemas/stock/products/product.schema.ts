/**
 * Product Zod Schemas
 * Schemas reutilizáveis para validação de produtos
 */

import { z } from 'zod';
import { dateSchema, idSchema, nameSchema } from '../../common.schema';

/**
 * Status de produto
 */
export const productStatusSchema = z.enum([
  'ACTIVE',
  'INACTIVE',
  'OUT_OF_STOCK',
  'DISCONTINUED',
]);

/**
 * Unidade de medida
 */
export const unitOfMeasureSchema = z.enum(['METERS', 'KILOGRAMS', 'UNITS']);

/**
 * Schema para criação de produto
 */
export const createProductSchema = z.object({
  name: nameSchema,
  code: z.string().min(1).max(64).optional(), // Código manual opcional (importação) - IMUTÁVEL após criação
  description: z.string().max(1000).optional(),
  status: productStatusSchema.optional().default('ACTIVE'),
  outOfLine: z.boolean().optional().default(false),
  attributes: z.record(z.string(), z.any()).optional(),
  templateId: idSchema,
  supplierId: idSchema.optional(),
  manufacturerId: idSchema.optional(),
});

/**
 * Schema para atualização de produto
 * code e fullCode são IMUTÁVEIS após criação
 */
export const updateProductSchema = z.object({
  name: nameSchema.optional(),
  // code e fullCode são imutáveis após criação
  description: z.string().max(1000).optional(),
  status: productStatusSchema.optional(),
  outOfLine: z.boolean().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  supplierId: idSchema.optional(),
  manufacturerId: idSchema.optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

/**
 * Schema para resposta de produto com entidades relacionadas
 * As entidades relacionadas são opcionais pois podem não ser carregadas em todos os casos
 */
export const productResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string().optional(),
  fullCode: z.string().optional(),
  sequentialCode: z.number().optional(),
  description: z.string().optional(),
  status: z.string(),
  outOfLine: z.boolean(),
  attributes: z.record(z.string(), z.any()),
  careInstructionIds: z.array(z.string()),
  templateId: idSchema,
  template: z
    .object({
      id: idSchema,
      name: z.string(),
      unitOfMeasure: z.string(),
      sequentialCode: z.number().optional(),
      productAttributes: z.record(z.string(), z.unknown()),
      variantAttributes: z.record(z.string(), z.unknown()),
      itemAttributes: z.record(z.string(), z.unknown()),
      isActive: z.boolean(),
      createdAt: dateSchema,
      updatedAt: dateSchema.optional(),
    })
    .optional(),
  supplierId: idSchema.optional(),
  supplier: z
    .object({
      id: idSchema,
      name: z.string(),
      sequentialCode: z.number().optional(),
      cnpj: z.string().optional(),
      taxId: z.string().optional(),
      contact: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
      paymentTerms: z.string().optional(),
      rating: z.number().optional(),
      isActive: z.boolean(),
      createdAt: dateSchema,
      updatedAt: dateSchema.optional(),
    })
    .nullable()
    .optional(),
  manufacturerId: idSchema.optional(),
  manufacturer: z
    .object({
      id: idSchema,
      name: z.string(),
      country: z.string(),
      email: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
      rating: z.number().nullable().optional(),
      isActive: z.boolean(),
      createdAt: dateSchema,
      updatedAt: dateSchema,
    })
    .nullable()
    .optional(),
  organizationId: idSchema.optional(),
  variants: z
    .array(
      z.object({
        id: idSchema,
        sku: z.string().optional(),
        fullCode: z.string().optional(),
        sequentialCode: z.number().optional(),
        name: z.string(),
        price: z.number(),
        costPrice: z.number().optional(),
        profitMargin: z.number().optional(),
        imageUrl: z.string().optional(),
        barcode: z.string().optional(),
        isActive: z.boolean(),
        createdAt: dateSchema,
        updatedAt: dateSchema.optional(),
      }),
    )
    .optional(),
  productCategories: z
    .array(
      z.object({
        id: idSchema,
        name: z.string(),
        slug: z.string(),
        description: z.string().nullable().optional(),
        displayOrder: z.number(),
        isActive: z.boolean(),
      }),
    )
    .optional(),
  productTags: z
    .array(
      z.object({
        id: idSchema,
        name: z.string(),
        slug: z.string(),
        color: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      }),
    )
    .optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  deletedAt: dateSchema.optional(),
});
