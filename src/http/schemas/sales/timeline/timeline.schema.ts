/**
 * TIMELINE SCHEMAS
 */

import { z } from 'zod';

export const getTimelineQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .positive()
      .default(1)
      .describe('Page number (starts at 1)'),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20)
      .describe('Items per page (max 100)'),
    contactId: z
      .string()
      .uuid()
      .optional()
      .describe('Filter by contact ID'),
    customerId: z
      .string()
      .uuid()
      .optional()
      .describe('Filter by customer ID'),
    dealId: z
      .string()
      .uuid()
      .optional()
      .describe('Filter by deal ID'),
  })
  .refine(
    (data) => data.contactId || data.customerId || data.dealId,
    {
      message: 'At least one entity ID (contactId, customerId, or dealId) is required',
    },
  );

export const timelineItemResponseSchema = z.object({
  type: z
    .enum(['activity', 'timeline_event'])
    .describe('Item type (activity or timeline event)'),
  id: z.string().uuid().describe('Item unique identifier'),
  date: z.coerce.date().describe('Item date (performedAt for activity, createdAt for event)'),
  title: z.string().describe('Item title'),
  activityType: z.string().nullable().optional().describe('Activity type (NOTE, CALL, etc.)'),
  eventType: z.string().nullable().optional().describe('Timeline event type (STAGE_CHANGE, etc.)'),
  metadata: z.record(z.string(), z.unknown()).nullable().optional().describe('Additional metadata'),
  performedByUserId: z.string().uuid().nullable().optional().describe('User who performed the action'),
  source: z.string().nullable().optional().describe('Source of the event'),
});
