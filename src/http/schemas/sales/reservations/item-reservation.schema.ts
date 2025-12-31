/**
 * ITEM RESERVATION SCHEMAS
 */

import { z } from 'zod';

export const createItemReservationSchema = z.object({
  itemId: z.string().uuid(),
  userId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reason: z.string().max(500).optional(),
  reference: z.string().max(255).optional(),
  expiresAt: z.coerce.date(),
});

export const itemReservationResponseSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
  userId: z.string().uuid(),
  quantity: z.number(),
  reason: z.string().optional(),
  reference: z.string().optional(),
  expiresAt: z.coerce.date(),
  releasedAt: z.coerce.date().optional(),
  isExpired: z.boolean(),
  isReleased: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
});
