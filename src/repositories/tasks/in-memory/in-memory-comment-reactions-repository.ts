import { randomUUID } from 'node:crypto';
import type {
  CommentReactionsRepository,
  CommentReactionRecord,
  CreateCommentReactionSchema,
} from '../comment-reactions-repository';

export class InMemoryCommentReactionsRepository
  implements CommentReactionsRepository
{
  public items: CommentReactionRecord[] = [];

  async create(
    data: CreateCommentReactionSchema,
  ): Promise<CommentReactionRecord> {
    const reaction: CommentReactionRecord = {
      id: randomUUID(),
      commentId: data.commentId,
      userId: data.userId,
      emoji: data.emoji,
      createdAt: new Date(),
    };

    this.items.push(reaction);
    return reaction;
  }

  async findByCommentId(commentId: string): Promise<CommentReactionRecord[]> {
    return this.items.filter(
      (reaction) => reaction.commentId === commentId,
    );
  }

  async findByCommentUserEmoji(
    commentId: string,
    userId: string,
    emoji: string,
  ): Promise<CommentReactionRecord | null> {
    return (
      this.items.find(
        (reaction) =>
          reaction.commentId === commentId &&
          reaction.userId === userId &&
          reaction.emoji === emoji,
      ) ?? null
    );
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((reaction) => reaction.id !== id);
  }
}
