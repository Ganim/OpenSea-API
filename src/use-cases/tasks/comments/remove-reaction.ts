import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CommentReactionsRepository } from '@/repositories/tasks/comment-reactions-repository';

interface RemoveReactionRequest {
  tenantId: string;
  userId: string;
  commentId: string;
  emoji: string;
}

export class RemoveReactionUseCase {
  constructor(private commentReactionsRepository: CommentReactionsRepository) {}

  async execute(request: RemoveReactionRequest): Promise<void> {
    const { userId, commentId, emoji } = request;

    const existingReaction =
      await this.commentReactionsRepository.findByCommentUserEmoji(
        commentId,
        userId,
        emoji,
      );

    if (!existingReaction) {
      throw new ResourceNotFoundError('Reaction not found');
    }

    await this.commentReactionsRepository.delete(existingReaction.id);
  }
}
