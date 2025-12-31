/**
 * Care Instructions Zod Schemas
 * Schemas for care label management
 */

import { z } from 'zod';

/**
 * Care instruction category
 */
export const careCategorySchema = z.enum([
  'WASH',
  'BLEACH',
  'DRY',
  'IRON',
  'PROFESSIONAL',
]);

/**
 * Care option response schema
 */
export const careOptionResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  category: careCategorySchema,
  assetPath: z.string(),
  label: z.string(),
});

/**
 * Care options grouped by category
 */
export const careOptionsByCategorySchema = z.object({
  WASH: z.array(careOptionResponseSchema),
  BLEACH: z.array(careOptionResponseSchema),
  DRY: z.array(careOptionResponseSchema),
  IRON: z.array(careOptionResponseSchema),
  PROFESSIONAL: z.array(careOptionResponseSchema),
});

/**
 * Set product care instructions request schema
 */
export const setProductCareInstructionsSchema = z.object({
  careInstructionIds: z
    .array(z.string().min(1))
    .max(20)
    .describe('Array of care instruction IDs from the catalog'),
});

/**
 * Set product care instructions response schema
 * Returns the updated product with resolved care instructions
 */
export const setProductCareResponseSchema = z.object({
  careInstructionIds: z.array(z.string()),
  careInstructions: z.array(careOptionResponseSchema),
});
