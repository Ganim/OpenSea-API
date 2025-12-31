/**
 * COMMENT SCHEMAS
 */

import { z } from 'zod';

export const createCommentSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
});

export const commentResponseSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  parentCommentId: z.string().uuid().optional(),
  isDeleted: z.boolean(),
  isEdited: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});
