/**
 * NOTIFICATION PREFERENCE SCHEMAS
 */

import { z } from 'zod';

export const createNotificationPreferenceSchema = z.object({
  userId: z.string().uuid(),
  alertType: z.enum([
    'LOW_STOCK',
    'OUT_OF_STOCK',
    'EXPIRING_SOON',
    'EXPIRED',
    'PRICE_CHANGE',
    'REORDER_POINT',
  ]),
  channel: z.enum(['IN_APP', 'EMAIL', 'SMS', 'PUSH']),
  isEnabled: z.boolean().optional().default(true),
});

export const notificationPreferenceResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  alertType: z.string(),
  channel: z.string(),
  isEnabled: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateNotificationPreferenceSchema = z.object({
  isEnabled: z.boolean().optional(),
});
