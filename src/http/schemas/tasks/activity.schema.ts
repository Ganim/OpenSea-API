import { z } from 'zod';

export const cardActivityTypeEnum = z.enum([
  'CREATED',
  'UPDATED',
  'MOVED',
  'ASSIGNED',
  'COMMENTED',
  'COMMENT_ADDED',
  'FIELD_CHANGED',
  'ATTACHMENT_ADDED',
  'ATTACHMENT_REMOVED',
  'LABEL_ADDED',
  'LABEL_REMOVED',
  'SUBTASK_ADDED',
  'SUBTASK_UPDATED',
  'SUBTASK_REMOVED',
  'SUBTASK_COMPLETED',
  'SUBTASK_REOPENED',
  'CHECKLIST_ITEM_COMPLETED',
  'CHECKLIST_ITEM_UNCOMPLETED',
  'AUTOMATION_TRIGGERED',
  'ARCHIVED',
  'RESTORED',
  'DELETED',
]);

export const listActivityQuerySchema = z.object({
  type: cardActivityTypeEnum.optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const activityResponseSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  boardId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string().optional().nullable(),
  type: z.string(),
  description: z.string(),
  field: z.string().optional().nullable(),
  oldValue: z.unknown().optional().nullable(),
  newValue: z.unknown().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  createdAt: z.coerce.date(),
});
