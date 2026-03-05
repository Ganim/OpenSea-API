import { z } from 'zod';

export const createChecklistSchema = z.object({
  title: z.string().min(1).max(256),
});

export const updateChecklistSchema = z.object({
  title: z.string().min(1).max(256).optional(),
});

export const addChecklistItemSchema = z.object({
  title: z.string().min(1).max(512),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).max(512).optional(),
  isCompleted: z.boolean().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const checklistItemResponseSchema = z.object({
  id: z.string().uuid(),
  checklistId: z.string().uuid(),
  title: z.string(),
  isCompleted: z.boolean(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  position: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const checklistResponseSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  title: z.string(),
  position: z.number(),
  items: z.array(checklistItemResponseSchema).optional(),
  createdAt: z.coerce.date(),
});
