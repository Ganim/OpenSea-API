/**
 * Stock Module Zod Schemas
 * Schemas reutilizáveis para variantes, itens, locais, etc.
 */

import z from 'zod';

// ============= ENUMS =============

export const itemStatusEnum = z.enum([
  'AVAILABLE',
  'RESERVED',
  'SOLD',
  'DAMAGED',
]);
export const movementTypeEnum = z.enum([
  'ENTRY',
  'EXIT',
  'TRANSFER',
  'ADJUSTMENT',
]);
export const purchaseOrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'RECEIVED',
  'CANCELLED',
]);

// ============= CATEGORY SCHEMAS =============

export const categorySchema = z.object({
  name: z.string().min(1).max(128),
  slug: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional(),
  parentId: z.uuid().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const categoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  parentId: z.uuid().nullable().optional(),
  displayOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateCategorySchema = categorySchema.partial();

// ============= VARIANT SCHEMAS =============

export const createVariantSchema = z.object({
  productId: z.uuid(),
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  costPrice: z.number().positive().optional(),
  profitMargin: z.number().optional(),
  barcode: z.string().max(100).optional(),
  qrCode: z.string().max(100).optional(),
  eanCode: z.string().max(100).optional(),
  upcCode: z.string().max(100).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().min(0).optional(),
});

export const variantResponseSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  sku: z.string(),
  name: z.string(),
  price: z.number(),
  imageUrl: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()),
  costPrice: z.number().optional(),
  profitMargin: z.number().optional(),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  eanCode: z.string().optional(),
  upcCode: z.string().optional(),
  minStock: z.number().optional(),
  maxStock: z.number().optional(),
  reorderPoint: z.number().optional(),
  reorderQuantity: z.number().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional(),
});

export const variantWithAggregationsResponseSchema =
  variantResponseSchema.extend({
    productCode: z.string(),
    productName: z.string(),
    itemCount: z.number(),
    totalCurrentQuantity: z.number(),
  });

export const updateVariantSchema = createVariantSchema
  .partial()
  .omit({ productId: true });

// ============= ITEM MOVEMENT SCHEMAS =============

export const itemMovementResponseSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
  userId: z.uuid(),
  quantity: z.number(),
  quantityBefore: z.number().nullable().optional(),
  quantityAfter: z.number().nullable().optional(),
  movementType: z.string(),
  reasonCode: z.string().nullable().optional(),
  destinationRef: z.string().nullable().optional(),
  batchNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  approvedBy: z.string().nullable().optional(),
  salesOrderId: z.uuid().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const itemMovementQuerySchema = z.object({
  itemId: z.uuid().optional(),
  userId: z.uuid().optional(),
  movementType: z.string().optional(),
  salesOrderId: z.uuid().optional(),
  batchNumber: z.string().optional(),
  pendingApproval: z.coerce.boolean().optional(),
});

// ============= ITEM SCHEMAS =============

export const createItemSchema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid(),
  serialNumber: z.string().min(1).max(100).optional(),
  batchNumber: z.string().min(1).max(100).optional(),
  expirationDate: z.coerce.date().optional(),
  status: itemStatusEnum.optional().default('AVAILABLE'),
});

export const itemResponseSchema = z.object({
  id: z.uuid(),
  variantId: z.uuid(),
  locationId: z.uuid(),
  uniqueCode: z.string(),
  initialQuantity: z.number(),
  currentQuantity: z.number(),
  status: z.string(),
  entryDate: z.coerce.date(),
  attributes: z.record(z.string(), z.unknown()),
  batchNumber: z.string().optional(),
  manufacturingDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional(),
  productCode: z.string(),
  productName: z.string(),
  variantSku: z.string(),
  variantName: z.string(),
});

export const transferItemSchema = z.object({
  itemId: z.uuid(),
  destinationLocationId: z.uuid(),
  reasonCode: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const itemTransferResponseSchema = z.object({
  item: itemResponseSchema,
  movement: itemMovementResponseSchema,
});

export const registerItemEntrySchema = z.object({
  uniqueCode: z.string().min(1).max(128),
  variantId: z.uuid(),
  locationId: z.uuid(),
  quantity: z.number().positive(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  batchNumber: z.string().max(100).optional(),
  manufacturingDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

export const itemEntryResponseSchema = z.object({
  item: itemResponseSchema,
  movement: z.object({
    id: z.uuid(),
    itemId: z.uuid(),
    userId: z.uuid(),
    quantity: z.number(),
    movementType: z.string(),
    createdAt: z.coerce.date(),
  }),
});

export const registerItemExitSchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().positive(),
  movementType: z.enum(['SALE', 'PRODUCTION', 'SAMPLE', 'LOSS']),
  reasonCode: z.string().max(50).optional(),
  destinationRef: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export const itemExitResponseSchema = z.object({
  item: itemResponseSchema,
  movement: itemMovementResponseSchema,
});

// ============= LOCATION SCHEMAS =============

export const createLocationSchema = z.object({
  code: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  locationType: z
    .enum(['WAREHOUSE', 'ZONE', 'AISLE', 'SHELF', 'BIN', 'OTHER'])
    .optional(),
  parentId: z.uuid().optional(),
  capacity: z.number().int().nonnegative().optional(),
  currentOccupancy: z.number().int().nonnegative().optional(),
});

export const locationResponseSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  description: z.string().optional(),
  locationType: z.string().optional(),
  parentId: z.uuid().optional(),
  capacity: z.number().optional(),
  currentOccupancy: z.number().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional(),
  subLocationCount: z.number().optional(),
  directItemCount: z.number().optional(),
  totalItemCount: z.number().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

// ============= MANUFACTURER SCHEMAS =============

export const createManufacturerSchema = z.object({
  name: z.string().min(1).max(255),
  country: z.string().min(1).max(100),
  email: z.email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().max(1000).optional(),
});

export const manufacturerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  country: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  isActive: z.boolean(),
  rating: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const updateManufacturerSchema = createManufacturerSchema.partial();

// ============= SUPPLIER SCHEMAS =============

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(255),
  cnpj: z.string().optional(),
  taxId: z.string().max(50).optional(),
  contact: z.string().max(255).optional(),
  email: z.email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  paymentTerms: z.string().max(255).optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export const supplierResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  cnpj: z.string().optional(),
  taxId: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  paymentTerms: z.string().optional(),
  rating: z.number().optional(),
  isActive: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ============= TAG SCHEMAS =============

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  description: z.string().max(500).optional(),
});

export const tagResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const updateTagSchema = createTagSchema.partial();

// ============= TEMPLATE SCHEMAS =============

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  productAttributes: z.record(z.string(), z.unknown()).optional(),
  variantAttributes: z.record(z.string(), z.unknown()).optional(),
  itemAttributes: z.record(z.string(), z.unknown()).optional(),
});

export const templateResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  productAttributes: z.record(z.string(), z.unknown()),
  variantAttributes: z.record(z.string(), z.unknown()),
  itemAttributes: z.record(z.string(), z.unknown()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// ============= PURCHASE ORDER SCHEMAS =============

export const createPurchaseOrderSchema = z.object({
  orderNumber: z.string().min(1).max(100),
  supplierId: z.uuid(),
  expectedDate: z.coerce.date().optional(),
  status: purchaseOrderStatusEnum.optional().default('PENDING'),
  notes: z.string().max(1000).optional(),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().positive(),
        unitCost: z.number().positive(),
      }),
    )
    .min(1),
});

export const purchaseOrderResponseSchema = z.object({
  id: z.uuid(),
  orderNumber: z.string(),
  status: z.string(),
  supplierId: z.uuid(),
  createdBy: z.uuid().nullable(),
  totalCost: z.number(),
  expectedDate: z.coerce.date().nullable(),
  receivedDate: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  items: z.array(
    z.object({
      id: z.uuid(),
      orderId: z.uuid(),
      variantId: z.uuid(),
      quantity: z.number(),
      unitCost: z.number(),
      totalCost: z.number(),
      notes: z.string().nullable(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date().nullable(),
    }),
  ),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: purchaseOrderStatusEnum,
});

// ============= QUERY PARAMS =============

export const stockQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
