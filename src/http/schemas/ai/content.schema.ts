import { z } from 'zod';

export const generateContentBodySchema = z.object({
  type: z.enum([
    'SOCIAL_POST',
    'PRODUCT_DESCRIPTION',
    'EMAIL_CAMPAIGN',
    'CATALOG_TEXT',
    'PROMOTION_BANNER',
  ]),
  context: z.object({
    productIds: z.array(z.string().uuid()).max(10).optional(),
    categoryId: z.string().uuid().optional(),
    promotionId: z.string().uuid().optional(),
    theme: z.string().max(100).optional(),
    tone: z.enum(['formal', 'casual', 'urgente', 'luxo']).optional(),
    platform: z.enum(['instagram', 'whatsapp', 'email', 'facebook']).optional(),
    maxLength: z.number().int().min(50).max(10000).optional(),
  }),
});

export const generatedContentBodySchema = z.object({
  title: z.string().optional(),
  body: z.string(),
  hashtags: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
});

export const generatedContentMetadataSchema = z.object({
  platform: z.string().optional(),
  characterCount: z.number(),
  suggestedImageDescription: z.string().optional(),
  targetAudience: z.string().optional(),
});

export const generatedContentSchema: z.ZodType = z.object({
  type: z.string(),
  content: generatedContentBodySchema,
  metadata: generatedContentMetadataSchema,
  variants: z.array(z.lazy(() => generatedContentSchema)).optional(),
});

export const generateContentResponseSchema = z.object({
  content: generatedContentSchema,
});
