import { prisma } from '@/lib/prisma';
import type {
  CommentReactionRecord,
  CommentReactionsRepository,
  CreateCommentReactionSchema,
} from '../comment-reactions-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): CommentReactionRecord {
  return {
    id: raw.id,
    commentId: raw.commentId,
    userId: raw.userId,
    emoji: raw.emoji,
    createdAt: raw.createdAt,
  };
}

export class PrismaCommentReactionsRepository
  implements CommentReactionsRepository
{
  async create(
    data: CreateCommentReactionSchema,
  ): Promise<CommentReactionRecord> {
    const raw = await prisma.commentReaction.create({
      data: {
        commentId: data.commentId,
        userId: data.userId,
        emoji: data.emoji,
      },
    });

    return toRecord(raw);
  }

  async findByCommentId(commentId: string): Promise<CommentReactionRecord[]> {
    const rows = await prisma.commentReaction.findMany({
      where: { commentId },
    });

    return rows.map(toRecord);
  }

  async findByCommentUserEmoji(
    commentId: string,
    userId: string,
    emoji: string,
  ): Promise<CommentReactionRecord | null> {
    const raw = await prisma.commentReaction.findFirst({
      where: { commentId, userId, emoji },
    });

    return raw ? toRecord(raw) : null;
  }

  async delete(id: string): Promise<void> {
    await prisma.commentReaction.delete({
      where: { id },
    });
  }
}
