import { z } from 'zod';

export const landingPageResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  template: z.string(),
  content: z.any(),
  formId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  isPublished: z.boolean(),
  publishedAt: z.coerce.date().optional(),
  viewCount: z.number(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const createLandingPageSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
  description: z.string().optional(),
  template: z
    .enum(['blank', 'lead-capture', 'product-showcase'])
    .default('lead-capture'),
  content: z.record(z.string(), z.unknown()).default({}),
  formId: z.string().uuid().optional(),
});

export const updateLandingPageSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    )
    .optional(),
  description: z.string().optional(),
  template: z.enum(['blank', 'lead-capture', 'product-showcase']).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  formId: z.string().uuid().nullable().optional(),
});
