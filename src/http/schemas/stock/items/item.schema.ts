/**
 * ITEM SCHEMAS
 */

import { z } from 'zod';
import { itemStatusEnum } from '../common/enums.schema';
import { itemMovementResponseSchema } from './item-movement.schema';

export const createItemSchema = z.object({
  variantId: z.uuid(),
  locationId: z.uuid().optional(), // Agora opcional
  serialNumber: z.string().min(1).max(100).optional(),
  batchNumber: z.string().min(1).max(100).optional(),
  expirationDate: z.coerce.date().optional(),
  status: itemStatusEnum.optional().default('AVAILABLE'),
});

export const itemResponseSchema = z.object({
  id: z.uuid(),
  variantId: z.uuid(),
  locationId: z.uuid().optional(),
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
  uniqueCode: z.string().min(1).max(128).optional(), // Agora opcional
  variantId: z.uuid(),
  locationId: z.uuid().optional(), // Agora opcional
  quantity: z.number().positive(),
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
