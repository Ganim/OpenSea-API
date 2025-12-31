/**
 * SALES ORDER SCHEMAS
 */

import { z } from 'zod';
import {
  createSalesOrderStatusEnum,
  salesOrderStatusEnum,
} from '../common/enums.schema';

export const salesOrderItemResponseSchema = z.object({
  id: z.string().uuid(),
  // orderId: z.string().uuid(), // removed - not returned by use-case
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  discount: z.number(),
  totalPrice: z.number(),
  notes: z.string().nullable().optional(),
  // createdAt: z.coerce.date(), // removed - not returned by use-case
  // updatedAt: z.coerce.date().optional(), // removed - not returned by use-case
});

export const salesOrderItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().max(1000).optional(),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().uuid(),
  orderNumber: z.string().min(1).max(100),
  status: createSalesOrderStatusEnum.optional().default('PENDING'),
  discount: z.number().min(0).optional().default(0),
  notes: z.string().max(1000).optional(),
  items: z.array(salesOrderItemSchema).min(1),
  createdBy: z.string().uuid().optional(),
});

export const salesOrderResponseSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string(),
  customerId: z.string().uuid(),
  createdBy: z.string().uuid().nullable().optional(),
  status: z.string(),
  totalPrice: z.number(),
  discount: z.number(),
  finalPrice: z.number(),
  notes: z.string().nullable().optional(),
  items: z.array(salesOrderItemResponseSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateSalesOrderStatusSchema = z.object({
  status: salesOrderStatusEnum,
});
