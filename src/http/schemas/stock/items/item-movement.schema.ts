/**
 * ITEM MOVEMENT SCHEMAS
 */

import { z } from 'zod';

export const itemMovementResponseSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
  userId: z.uuid(),
  quantity: z.number(),
  quantityBefore: z.number().nullable().optional(),
  quantityAfter: z.number().nullable().optional(),
  movementType: z.string(),
  reasonCode: z.string().nullable().optional(),
  originRef: z.string().nullable().optional(),
  destinationRef: z.string().nullable().optional(),
  batchNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  approvedBy: z.string().nullable().optional(),
  salesOrderId: z.uuid().nullable().optional(),
  createdAt: z.coerce.date(),
  user: z
    .object({
      id: z.uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),
});

export const itemMovementQuerySchema = z.object({
  itemId: z.uuid().optional(),
  userId: z.uuid().optional(),
  movementType: z.string().optional(),
  salesOrderId: z.uuid().optional(),
  batchNumber: z.string().optional(),
  pendingApproval: z.coerce.boolean().optional(),
});
