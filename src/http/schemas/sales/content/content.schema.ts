import { z } from 'zod';

// ─── Create Generated Content ────────────────────────────────────────────────

export const createGeneratedContentSchema = z.object({
  type: z
    .enum([
      'SOCIAL_POST',
      'SOCIAL_STORY',
      'SOCIAL_REEL',
      'FOLDER_PAGE',
      'EMAIL_CAMPAIGN',
      'BANNER',
      'PRODUCT_CARD',
      'VIDEO',
      'MOCKUP',
    ])
    .describe('Content type'),
  channel: z
    .enum([
      'INSTAGRAM',
      'FACEBOOK',
      'TIKTOK',
      'WHATSAPP',
      'EMAIL',
      'PRINT',
      'WEB',
    ])
    .optional()
    .describe('Target channel'),
  title: z.string().max(256).optional().describe('Content title'),
  caption: z.string().max(5000).optional().describe('Content caption'),
  hashtags: z.array(z.string()).optional().default([]).describe('Hashtags'),
  templateId: z.string().uuid().optional().describe('Template ID'),
  brandId: z.string().uuid().optional().describe('Brand ID'),
  variantIds: z
    .array(z.string().uuid())
    .optional()
    .default([])
    .describe('Variant IDs'),
  catalogId: z.string().uuid().optional().describe('Catalog ID'),
  campaignId: z.string().uuid().optional().describe('Campaign ID'),
  aiGenerated: z.boolean().optional().default(false).describe('AI generated'),
  aiPrompt: z.string().max(2000).optional().describe('AI prompt'),
  aiModel: z.string().max(64).optional().describe('AI model name'),
});

// ─── Generated Content Response ──────────────────────────────────────────────

export const generatedContentResponseSchema = z.object({
  id: z.string().uuid().describe('Content ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  type: z.string().describe('Content type'),
  channel: z.string().nullable().describe('Target channel'),
  status: z.string().describe('Content status'),
  title: z.string().nullable().describe('Content title'),
  caption: z.string().nullable().describe('Content caption'),
  hashtags: z.array(z.string()).describe('Hashtags'),
  templateId: z.string().nullable().describe('Template ID'),
  brandId: z.string().nullable().describe('Brand ID'),
  fileId: z.string().nullable().describe('File ID'),
  thumbnailFileId: z.string().nullable().describe('Thumbnail file ID'),
  variantIds: z.array(z.string()).describe('Variant IDs'),
  campaignId: z.string().nullable().describe('Campaign ID'),
  catalogId: z.string().nullable().describe('Catalog ID'),
  aiGenerated: z.boolean().describe('AI generated'),
  aiPrompt: z.string().nullable().describe('AI prompt'),
  aiModel: z.string().nullable().describe('AI model'),
  publishedAt: z.coerce.date().nullable().describe('Published date'),
  publishedTo: z.string().nullable().describe('Published to'),
  scheduledAt: z.coerce.date().nullable().describe('Scheduled date'),
  approvedByUserId: z.string().nullable().describe('Approved by user ID'),
  approvedAt: z.coerce.date().nullable().describe('Approval date'),
  views: z.number().int().describe('View count'),
  clicks: z.number().int().describe('Click count'),
  shares: z.number().int().describe('Share count'),
  engagement: z.number().nullable().describe('Engagement rate'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

// ─── List Generated Contents Query ───────────────────────────────────────────

export const listGeneratedContentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  type: z
    .enum([
      'SOCIAL_POST',
      'SOCIAL_STORY',
      'SOCIAL_REEL',
      'FOLDER_PAGE',
      'EMAIL_CAMPAIGN',
      'BANNER',
      'PRODUCT_CARD',
      'VIDEO',
      'MOCKUP',
    ])
    .optional(),
  status: z
    .enum(['DRAFT', 'READY', 'APPROVED', 'PUBLISHED', 'ARCHIVED'])
    .optional(),
  catalogId: z.string().uuid().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
