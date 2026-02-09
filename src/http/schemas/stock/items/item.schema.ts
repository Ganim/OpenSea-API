/**
 * ITEM SCHEMAS
 */

import { z } from 'zod';
import { itemStatusEnum } from '../common/enums.schema';
import { itemMovementResponseSchema } from './item-movement.schema';

/**
 * Validation helper for quantity fields
 * - Must be positive
 * - Maximum 3 decimal places
 */
const quantitySchema = z
  .number()
  .positive('Quantidade deve ser positiva')
  .refine(
    (val) => {
      // Check if has at most 3 decimal places
      const decimalPart = val.toString().split('.')[1];
      return !decimalPart || decimalPart.length <= 3;
    },
    { message: 'Quantidade deve ter no máximo 3 casas decimais' },
  );

export const createItemSchema = z.object({
  variantId: z.uuid(),
  binId: z.uuid().optional(), // Referência ao bin onde o item está armazenado
  serialNumber: z.string().min(1).max(100).optional(),
  batchNumber: z.string().min(1).max(100).optional(),
  expirationDate: z.coerce.date().optional(),
  status: itemStatusEnum.optional().default('AVAILABLE'),
});

export const itemResponseSchema = z.object({
  id: z.uuid(),
  variantId: z.uuid(),
  binId: z.uuid().optional(),
  locationId: z.uuid().optional(),
  resolvedAddress: z.string().optional(),
  lastKnownAddress: z.string().nullable().optional(),
  uniqueCode: z.string().optional(),
  fullCode: z.string().optional(),
  sequentialCode: z.number().optional(),
  initialQuantity: z.number(),
  currentQuantity: z.number(),
  unitCost: z.number().optional(),
  totalCost: z.number().optional(),
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
  templateId: z.string().uuid().optional(),
  templateName: z.string().optional(),
  templateUnitOfMeasure: z.string().optional(),
  productAttributes: z.record(z.string(), z.unknown()).optional(),
  variantAttributes: z.record(z.string(), z.unknown()).optional(),
  variantColorHex: z.string().optional(),
  manufacturerName: z.string().optional(),
  productId: z.string().uuid().optional(),
  bin: z
    .object({
      id: z.string(),
      address: z.string(),
      zone: z.object({
        id: z.string(),
        warehouseId: z.string().uuid(),
        code: z.string(),
        name: z.string(),
      }),
    })
    .optional(),
});

export const transferItemSchema = z.object({
  itemId: z.uuid(),
  destinationBinId: z.uuid(),
  reasonCode: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const itemTransferResponseSchema = z.object({
  item: itemResponseSchema,
  movement: itemMovementResponseSchema,
});

export const registerItemEntrySchema = z.object({
  uniqueCode: z.string().min(1).max(128).optional(),
  variantId: z.uuid(),
  binId: z.uuid().optional(), // Referência ao bin onde o item está armazenado
  quantity: quantitySchema,
  unitCost: z.number().nonnegative().optional(),
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

export const batchTransferItemsSchema = z.object({
  itemIds: z.array(z.uuid()).min(1).max(100),
  destinationBinId: z.uuid(),
  notes: z.string().max(1000).optional(),
});

export const batchTransferResponseSchema = z.object({
  transferred: z.number(),
  movements: z.array(itemMovementResponseSchema),
});

export const locationHistoryEntrySchema = z.object({
  id: z.uuid(),
  date: z.coerce.date(),
  type: z.string(),
  from: z.string().nullable(),
  to: z.string().nullable(),
  userId: z.uuid(),
  notes: z.string().nullable(),
});

export const locationHistoryResponseSchema = z.object({
  data: z.array(locationHistoryEntrySchema),
});

export const registerItemExitSchema = z.object({
  itemId: z.uuid(),
  quantity: quantitySchema,
  movementType: z.enum(['SALE', 'PRODUCTION', 'SAMPLE', 'LOSS']),
  reasonCode: z.string().max(50).optional(),
  destinationRef: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

export const itemExitResponseSchema = z.object({
  item: itemResponseSchema,
  movement: itemMovementResponseSchema,
});
