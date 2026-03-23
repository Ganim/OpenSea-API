import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardCommentsRepository } from '@/repositories/tasks/card-comments-repository';
import type {
  CommentReactionsRepository,
  CommentReactionRecord,
} from '@/repositories/tasks/comment-reactions-repository';

interface AddReactionRequest {
  tenantId: string;
  userId: string;
  commentId: string;
  cardId: string;
  emoji: string;
}

interface AddReactionResponse {
  reaction: CommentReactionRecord;
  removed: boolean;
}

export class AddReactionUseCase {
  constructor(
    private cardCommentsRepository: CardCommentsRepository,
    private commentReactionsRepository: CommentReactionsRepository,
  ) {}

  async execute(request: AddReactionRequest): Promise<AddReactionResponse> {
    const { userId, commentId, cardId, emoji } = request;

    const existingComment = await this.cardCommentsRepository.findById(
      commentId,
      cardId,
    );

    if (!existingComment) {
      throw new ResourceNotFoundError('Comment not found');
    }

    const existingReaction =
      await this.commentReactionsRepository.findByCommentUserEmoji(
        commentId,
        userId,
        emoji,
      );

    // Toggle: remove if already exists, add if not
    if (existingReaction) {
      await this.commentReactionsRepository.delete(existingReaction.id);
      return { reaction: existingReaction, removed: true };
    }

    const reaction = await this.commentReactionsRepository.create({
      commentId,
      userId,
      emoji,
    });

    return { reaction, removed: false };
  }
}
