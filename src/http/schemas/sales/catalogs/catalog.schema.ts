import { z } from 'zod';

// ─── Create Catalog ──────────────────────────────────────────────────────────

export const createCatalogSchema = z.object({
  name: z.string().min(1).max(128).describe('Catalog name'),
  description: z.string().max(2000).optional().describe('Catalog description'),
  type: z
    .enum(['GENERAL', 'SELLER', 'CAMPAIGN', 'CUSTOMER', 'AI_GENERATED'])
    .optional()
    .default('GENERAL')
    .describe('Catalog type'),
  slug: z
    .string()
    .max(128)
    .optional()
    .describe('URL slug (auto-generated if empty)'),
  layout: z
    .enum(['GRID', 'LIST', 'MAGAZINE'])
    .optional()
    .default('GRID')
    .describe('Catalog layout'),
  showPrices: z
    .boolean()
    .optional()
    .default(true)
    .describe('Show product prices'),
  showStock: z
    .boolean()
    .optional()
    .default(false)
    .describe('Show stock availability'),
  isPublic: z
    .boolean()
    .optional()
    .default(false)
    .describe('Make catalog public'),
  customerId: z.string().uuid().optional().describe('Customer ID'),
  campaignId: z.string().uuid().optional().describe('Campaign ID'),
  assignedToUserId: z.string().uuid().optional().describe('Assigned user ID'),
  priceTableId: z.string().uuid().optional().describe('Price table ID'),
});

// ─── Update Catalog ──────────────────────────────────────────────────────────

export const updateCatalogSchema = z.object({
  name: z.string().min(1).max(128).optional().describe('Catalog name'),
  description: z.string().max(2000).optional().describe('Catalog description'),
  slug: z.string().max(128).optional().describe('URL slug'),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])
    .optional()
    .describe('Catalog status'),
  layout: z
    .enum(['GRID', 'LIST', 'MAGAZINE'])
    .optional()
    .describe('Catalog layout'),
  showPrices: z.boolean().optional().describe('Show product prices'),
  showStock: z.boolean().optional().describe('Show stock availability'),
  isPublic: z.boolean().optional().describe('Make catalog public'),
  coverImageFileId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe('Cover image file ID'),
});

// ─── Catalog Response ────────────────────────────────────────────────────────

export const catalogResponseSchema = z.object({
  id: z.string().uuid().describe('Catalog ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  name: z.string().describe('Catalog name'),
  slug: z.string().nullable().describe('URL slug'),
  description: z.string().nullable().describe('Description'),
  type: z.string().describe('Catalog type'),
  status: z.string().describe('Catalog status'),
  coverImageFileId: z.string().nullable().describe('Cover image file ID'),
  assignedToUserId: z.string().nullable().describe('Assigned user ID'),
  customerId: z.string().nullable().describe('Customer ID'),
  campaignId: z.string().nullable().describe('Campaign ID'),
  rules: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe('Auto-population rules'),
  aiCurated: z.boolean().describe('Whether AI curated'),
  layout: z.string().describe('Layout type'),
  showPrices: z.boolean().describe('Show prices'),
  showStock: z.boolean().describe('Show stock'),
  priceTableId: z.string().nullable().describe('Price table ID'),
  isPublic: z.boolean().describe('Is public'),
  publicUrl: z.string().nullable().describe('Public URL'),
  qrCodeUrl: z.string().nullable().describe('QR code URL'),
  itemCount: z.number().int().optional().describe('Number of items'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

// ─── Add Catalog Item ────────────────────────────────────────────────────────

export const addCatalogItemSchema = z.object({
  variantId: z.string().uuid().describe('Variant ID to add'),
  position: z.number().int().min(0).optional().describe('Item position'),
  featured: z.boolean().optional().default(false).describe('Featured item'),
  customNote: z.string().max(500).optional().describe('Custom note'),
});

// ─── List Catalogs Query ─────────────────────────────────────────────────────

export const listCatalogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  type: z
    .enum(['GENERAL', 'SELLER', 'CAMPAIGN', 'CUSTOMER', 'AI_GENERATED'])
    .optional(),
  isPublic: z
    .union([z.string(), z.boolean()])
    .transform((val) => val === true || val === 'true')
    .optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
