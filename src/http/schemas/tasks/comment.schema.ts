import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  mentions: z.array(z.string().uuid()).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const addReactionSchema = z.object({
  emoji: z.string().min(1).max(8),
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const commentReactionResponseSchema = z.object({
  id: z.string().uuid(),
  commentId: z.string().uuid(),
  userId: z.string().uuid(),
  emoji: z.string(),
  createdAt: z.coerce.date(),
});

export const commentResponseSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorName: z.string().optional().nullable(),
  authorEmail: z.string().optional().nullable(),
  content: z.string(),
  mentions: z.array(z.string()).optional().nullable(),
  editedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
});
