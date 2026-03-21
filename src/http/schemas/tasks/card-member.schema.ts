import { z } from 'zod';

export const addCardMemberSchema = z.object({
  userId: z.string().uuid(),
});

export const cardMemberResponseSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  userId: z.string().uuid(),
  boardId: z.string().uuid(),
  role: z.string(),
  createdAt: z.date(),
});
