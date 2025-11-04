/**
 * Product Zod Schemas
 * Schemas reutilizáveis para validação de produtos
 */

import { z } from 'zod';
import { dateSchema, idSchema, nameSchema } from './common.schema';

/**
 * Status de produto
 */
export const productStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

/**
 * Unidade de medida
 */
export const unitOfMeasureSchema = z.enum(['METERS', 'KILOGRAMS', 'UNITS']);

/**
 * Schema para criação de produto
 */
export const createProductSchema = z.object({
  name: nameSchema,
  code: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  status: productStatusSchema.optional().default('ACTIVE'),
  unitOfMeasure: unitOfMeasureSchema,
  attributes: z.record(z.string(), z.any()).optional(),
  templateId: idSchema,
  supplierId: idSchema.optional(),
  manufacturerId: idSchema.optional(),
});

/**
 * Schema para atualização de produto
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * Schema para resposta de produto
 */
export const productResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  status: z.string(),
  unitOfMeasure: z.string(),
  attributes: z.record(z.string(), z.any()),
  templateId: idSchema,
  supplierId: idSchema.optional(),
  manufacturerId: idSchema.optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  deletedAt: dateSchema.optional(),
});
