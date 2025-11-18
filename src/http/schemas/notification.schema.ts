import { z } from 'zod';
import { idSchema, paginationSchema } from './common.schema';

export const notificationTypeSchema = z.enum([
  'INFO',
  'WARNING',
  'ERROR',
  'SUCCESS',
  'REMINDER',
]);

export const notificationPrioritySchema = z.enum([
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
]);

export const notificationChannelSchema = z.enum([
  'IN_APP',
  'EMAIL',
  'SMS',
  'PUSH',
]);

export const createNotificationSchema = z.object({
  userId: idSchema,
  title: z.string().min(1).max(256),
  message: z.string().min(1),
  type: notificationTypeSchema,
  priority: notificationPrioritySchema.default('NORMAL'),
  channel: notificationChannelSchema,
  actionUrl: z.string().url().optional(),
  actionText: z.string().max(64).optional(),
  entityType: z.string().max(32).optional(),
  entityId: z.string().max(36).optional(),
  scheduledFor: z.coerce.date().optional(),
});

export const listNotificationsQuerySchema = paginationSchema.extend({
  isRead: z.coerce.boolean().optional(),
  type: notificationTypeSchema.optional(),
  channel: notificationChannelSchema.optional(),
  priority: notificationPrioritySchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const notificationResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  type: notificationTypeSchema,
  priority: notificationPrioritySchema,
  channel: notificationChannelSchema,
  actionUrl: z.string().url().optional().nullable(),
  actionText: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  isRead: z.boolean(),
  isSent: z.boolean(),
  scheduledFor: z.coerce.date().optional().nullable(),
  readAt: z.coerce.date().optional().nullable(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
});
