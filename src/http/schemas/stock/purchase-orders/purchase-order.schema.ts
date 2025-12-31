/**
 * PURCHASE ORDER SCHEMAS
 */

import { z } from 'zod';
import { purchaseOrderStatusEnum } from '../common/enums.schema';

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
