/**
 * ACTIVITY SCHEMAS
 */

import { z } from 'zod';

const activityTypeEnum = z.enum([
  'NOTE',
  'CALL',
  'MEETING',
  'TASK',
  'EMAIL_SENT',
  'EMAIL_RECEIVED',
]);

export const createActivitySchema = z.object({
  type: activityTypeEnum.describe('Type of activity'),
  title: z
    .string()
    .min(1)
    .max(256)
    .describe('Title of the activity'),
  description: z
    .string()
    .max(4096)
    .optional()
    .describe('Activity description'),
  contactId: z
    .string()
    .uuid()
    .optional()
    .describe('Related contact ID'),
  customerId: z
    .string()
    .uuid()
    .optional()
    .describe('Related customer ID'),
  dealId: z
    .string()
    .uuid()
    .optional()
    .describe('Related deal ID'),
  dueAt: z.coerce
    .date()
    .optional()
    .describe('Due date for the activity'),
  duration: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Duration in seconds'),
  outcome: z
    .string()
    .max(1024)
    .optional()
    .describe('Outcome or result of the activity'),
  metadata: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Additional metadata'),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  completedAt: z.coerce
    .date()
    .optional()
    .describe('Date activity was completed'),
});

export const activityResponseSchema = z.object({
  id: z.string().uuid().describe('Activity unique identifier'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  type: z.string().describe('Activity type'),
  title: z.string().describe('Activity title'),
  description: z.string().nullable().optional().describe('Description'),
  contactId: z.string().uuid().nullable().optional().describe('Related contact ID'),
  customerId: z.string().uuid().nullable().optional().describe('Related customer ID'),
  dealId: z.string().uuid().nullable().optional().describe('Related deal ID'),
  performedByUserId: z.string().uuid().nullable().optional().describe('User who performed the activity'),
  performedAt: z.coerce.date().describe('Date activity was performed'),
  dueAt: z.coerce.date().nullable().optional().describe('Due date'),
  completedAt: z.coerce.date().nullable().optional().describe('Completion date'),
  duration: z.number().nullable().optional().describe('Duration in seconds'),
  outcome: z.string().nullable().optional().describe('Outcome'),
  metadata: z.record(z.string(), z.unknown()).nullable().optional().describe('Metadata'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().optional().describe('Last update date'),
  deletedAt: z.coerce.date().nullable().optional().describe('Soft delete date'),
});

export const listActivitiesQuerySchema = z.object({
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
  type: activityTypeEnum
    .optional()
    .describe('Filter by activity type'),
  sortBy: z
    .enum(['performedAt', 'createdAt'])
    .optional()
    .default('createdAt')
    .describe('Sort field'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});
