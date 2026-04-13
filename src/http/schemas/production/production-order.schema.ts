import { z } from 'zod';

export const createProductionOrderSchema = z.object({
  bomId: z.string().min(1),
  productId: z.string().min(1),
  salesOrderId: z.string().optional(),
  parentOrderId: z.string().optional(),
  priority: z.number().int().min(1).max(100).optional().default(50),
  quantityPlanned: z.number().positive(),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateProductionOrderSchema = z.object({
  priority: z.number().int().min(1).max(100).optional(),
  quantityPlanned: z.number().positive().optional(),
  plannedStartDate: z.coerce.date().optional().nullable(),
  plannedEndDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const productionOrderResponseSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  bomId: z.string(),
  productId: z.string(),
  salesOrderId: z.string().nullable(),
  parentOrderId: z.string().nullable(),
  status: z.string(),
  priority: z.number(),
  quantityPlanned: z.number(),
  quantityStarted: z.number(),
  quantityCompleted: z.number(),
  quantityScrapped: z.number(),
  plannedStartDate: z.coerce.date().nullable(),
  plannedEndDate: z.coerce.date().nullable(),
  actualStartDate: z.coerce.date().nullable(),
  actualEndDate: z.coerce.date().nullable(),
  releasedAt: z.coerce.date().nullable(),
  releasedById: z.string().nullable(),
  notes: z.string().nullable(),
  createdById: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const productionOrderStatusCountSchema = z.object({
  DRAFT: z.number(),
  PLANNED: z.number(),
  FIRM: z.number(),
  RELEASED: z.number(),
  IN_PROCESS: z.number(),
  TECHNICALLY_COMPLETE: z.number(),
  CLOSED: z.number(),
  CANCELLED: z.number(),
});
