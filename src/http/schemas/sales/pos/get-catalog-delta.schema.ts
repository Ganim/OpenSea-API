import { z } from 'zod';

/**
 * Query schema for `GET /v1/pos/catalog/delta`. The `since` parameter is an
 * optional ISO-8601 timestamp; when omitted the endpoint performs a full sync
 * of the catalog scope. Value is parsed into a `Date` by Zod's `coerce.date`
 * so the use case receives a real `Date`.
 */
export const getCatalogDeltaQuerySchema = z.object({
  since: z.coerce.date().optional(),
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

export const getCatalogDeltaResponseSchema = z.object({
  currentTimestamp: z.date(),
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

export type GetCatalogDeltaQuery = z.infer<typeof getCatalogDeltaQuerySchema>;
export type GetCatalogDeltaResponseDTO = z.infer<
  typeof getCatalogDeltaResponseSchema
>;
