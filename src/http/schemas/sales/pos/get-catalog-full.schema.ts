import { z } from 'zod';

import {
  DEFAULT_CATALOG_FULL_PAGE_SIZE,
  MAX_CATALOG_FULL_PAGE_SIZE,
} from '@/use-cases/sales/pos-catalog/get-catalog-full';

/**
 * Query schema for `GET /v1/pos/catalog/full`.
 *
 * - `cursor` is the last `Item.id` returned by the previous call. Omit on the
 *   first call. UUID is enforced so a malformed cursor fails fast (400)
 *   rather than silently returning a wrong page.
 * - `limit` defaults to `DEFAULT_CATALOG_FULL_PAGE_SIZE` (100) and is capped
 *   at `MAX_CATALOG_FULL_PAGE_SIZE` (500). The schema clamps client input;
 *   the use case repeats the clamp as defense-in-depth.
 */
export const getCatalogFullQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_CATALOG_FULL_PAGE_SIZE)
    .default(DEFAULT_CATALOG_FULL_PAGE_SIZE),
});

const catalogTerminalZoneLinkSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  tier: z.enum(['PRIMARY', 'SECONDARY']),
});

const catalogZoneSchema = z.object({
  id: z.string(),
  warehouseId: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  allowsFractionalSale: z.boolean(),
  minFractionalSale: z.number().nullable(),
});

const catalogProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullCode: z.string().optional(),
  description: z.string().optional(),
  status: z.string(),
  outOfLine: z.boolean(),
  templateId: z.string(),
  manufacturerId: z.string().optional(),
  attributes: z.record(z.unknown()),
  updatedAt: z.date().optional(),
});

const catalogVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  sku: z.string().optional(),
  fullCode: z.string().optional(),
  name: z.string(),
  price: z.number(),
  barcode: z.string().optional(),
  eanCode: z.string().optional(),
  upcCode: z.string().optional(),
  isActive: z.boolean(),
  fractionalAllowed: z.boolean(),
  attributes: z.record(z.unknown()),
  updatedAt: z.date().optional(),
});

const catalogItemSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  binId: z.string().optional(),
  fullCode: z.string().optional(),
  barcode: z.string().optional(),
  eanCode: z.string().optional(),
  upcCode: z.string().optional(),
  currentQuantity: z.number(),
  status: z.string(),
  fractionalSaleEnabled: z.boolean(),
  batchNumber: z.string().optional(),
  expiryDate: z.date().optional(),
  updatedAt: z.date().optional(),
});

const catalogPromotionSchema = z.object({
  id: z.string(),
  variantId: z.string(),
  name: z.string(),
  discountType: z.string(),
  discountValue: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
});

const catalogOperatorSchema = z.object({
  id: z.string(),
  shortId: z.string().nullable(),
  fullName: z.string(),
  isActive: z.boolean(),
});

const catalogTerminalConfigSchema = z.object({
  id: z.string(),
  terminalCode: z.string(),
  terminalName: z.string(),
  mode: z.enum(['SALES_ONLY', 'SALES_WITH_CHECKOUT', 'CASHIER', 'TOTEM']),
  operatorSessionMode: z.enum(['PER_SALE', 'STAY_LOGGED_IN']),
  operatorSessionTimeout: z.number().int().nullable(),
  autoCloseSessionAt: z.string().nullable(),
  coordinationMode: z.enum(['STANDALONE', 'SELLER', 'CASHIER', 'BOTH']),
});

const catalogFiscalConfigSchema = z.object({
  id: z.string(),
  enabledDocumentTypes: z.array(z.string()),
  defaultDocumentType: z.string(),
  emissionMode: z.string(),
  certificatePath: z.string().nullable(),
  nfceSeries: z.number().int().nullable(),
  nfceNextNumber: z.number().int().nullable(),
  satDeviceId: z.string().nullable(),
});

export const getCatalogFullResponseSchema = z.object({
  currentTimestamp: z.date(),
  nextCursor: z.string().nullable(),
  terminalConfig: catalogTerminalConfigSchema,
  terminalZoneLinks: z.array(catalogTerminalZoneLinkSchema),
  zones: z.array(catalogZoneSchema),
  products: z.array(catalogProductSchema),
  variants: z.array(catalogVariantSchema),
  items: z.array(catalogItemSchema),
  promotions: z.array(catalogPromotionSchema),
  operators: z.array(catalogOperatorSchema),
  fiscalConfig: catalogFiscalConfigSchema.nullable(),
});

export type GetCatalogFullQuery = z.infer<typeof getCatalogFullQuerySchema>;
export type GetCatalogFullResponseDTO = z.infer<
  typeof getCatalogFullResponseSchema
>;
