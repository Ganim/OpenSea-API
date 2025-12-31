/**
 * TEMPLATE SCHEMAS
 */

import { z } from 'zod';

export const careLabelSchema = z.object({
  washing: z.string().optional(),
  drying: z.string().optional(),
  ironing: z.string().optional(),
  bleaching: z.string().optional(),
  dryClean: z.string().optional(),
  composition: z
    .array(
      z.object({
        fiber: z.string(),
        percentage: z.number().min(0).max(100),
      }),
    )
    .optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  unitOfMeasure: z
    .enum(['METERS', 'KILOGRAMS', 'UNITS'])
    .optional()
    .default('UNITS'),
  productAttributes: z.record(z.string(), z.unknown()).optional(),
  variantAttributes: z.record(z.string(), z.unknown()).optional(),
  itemAttributes: z.record(z.string(), z.unknown()).optional(),
  careLabel: careLabelSchema.optional(),
  isActive: z.boolean().optional().default(true),
});

export const templateResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  unitOfMeasure: z.string(),
  productAttributes: z.record(z.string(), z.unknown()),
  variantAttributes: z.record(z.string(), z.unknown()),
  itemAttributes: z.record(z.string(), z.unknown()),
  careLabel: careLabelSchema.nullable(),
  sequentialCode: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();
