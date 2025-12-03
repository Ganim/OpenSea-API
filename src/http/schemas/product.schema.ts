/**
 * Product Zod Schemas
 * Schemas reutilizáveis para validação de produtos
 */

import { z } from 'zod';
import { dateSchema, idSchema, nameSchema } from './common.schema';

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
  code: z.string().min(1).max(50).optional(), // Agora opcional
  description: z.string().max(1000).optional(),
  status: productStatusSchema.optional().default('ACTIVE'),
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
  code: z.string().optional(),
  fullCode: z.string().optional(),
  sequentialCode: z.number().optional(),
  description: z.string().optional(),
  status: z.string(),
  attributes: z.record(z.string(), z.any()),
  templateId: idSchema,
  supplierId: idSchema.optional(),
  manufacturerId: idSchema.optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  deletedAt: dateSchema.optional(),
});
