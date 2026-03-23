import { z } from 'zod';

import { boardLabelResponseSchema } from './board.schema';
import { checklistResponseSchema } from './checklist.schema';
import { cardCustomFieldValueResponseSchema } from './custom-field.schema';

export const cardStatusEnum = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'DONE',
  'CANCELED',
]);
export const cardPriorityEnum = z.enum([
  'NONE',
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

export const createCardSchema = z.object({
  columnId: z.string().uuid().optional(),
  title: z.string().min(1).max(512),
  description: z.string().max(10000).optional().nullable(),
  status: cardStatusEnum.optional().default('OPEN'),
  priority: cardPriorityEnum.optional().default('NONE'),
  assigneeId: z.string().uuid().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
  coverColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
  labelIds: z.array(z.string().uuid()).optional(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .nullable(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).max(512).optional(),
  description: z.string().max(10000).optional().nullable(),
  status: cardStatusEnum.optional(),
  priority: cardPriorityEnum.optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
  coverColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .nullable(),
});

export const moveCardSchema = z.object({
  columnId: z.string().uuid(),
  position: z.number().int().min(0).optional(),
});

export const assignCardSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

export const manageCardLabelsSchema = z.object({
  labelIds: z.array(z.string().uuid()),
});

export const listCardsQuerySchema = z.object({
  columnId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  labelIds: z
    .string()
    .transform((val) => val.split(',').filter(Boolean))
    .optional(),
  priority: cardPriorityEnum.optional(),
  status: cardStatusEnum.optional(),
  search: z.string().max(256).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  includeArchived: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const cardResponseSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  columnId: z.string().uuid(),
  parentCardId: z.string().uuid().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  status: z.string(),
  priority: z.string(),
  position: z.number(),
  assigneeId: z.string().uuid().optional().nullable(),
  assigneeName: z.string().optional().nullable(),
  reporterId: z.string().uuid(),
  reporterName: z.string().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
  estimatedMinutes: z.number().optional().nullable(),
  coverColor: z.string().optional().nullable(),
  coverImageId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  systemSourceType: z.string().optional().nullable(),
  systemSourceId: z.string().optional().nullable(),
  labels: z.array(boardLabelResponseSchema).optional(),
  checklists: z.array(checklistResponseSchema).optional(),
  customFieldValues: z.array(cardCustomFieldValueResponseSchema).optional(),
  subtaskCount: z.number().optional(),
  subtaskCompletedCount: z.number().optional(),
  commentCount: z.number().optional(),
  attachmentCount: z.number().optional(),
  checklistProgress: z
    .object({ total: z.number(), completed: z.number() })
    .optional(),
  isOverdue: z.boolean().optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});
