import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardCommentsRepository } from '@/repositories/tasks/card-comments-repository';

interface DeleteCommentRequest {
  tenantId: string;
  userId: string;
  commentId: string;
  cardId: string;
}

export class DeleteCommentUseCase {
  constructor(private cardCommentsRepository: CardCommentsRepository) {}

  async execute(request: DeleteCommentRequest): Promise<void> {
    const { userId, commentId, cardId } = request;

    const existingComment = await this.cardCommentsRepository.findById(
      commentId,
      cardId,
    );

    if (!existingComment) {
      throw new ResourceNotFoundError('Comment not found');
    }

    if (existingComment.authorId !== userId) {
      throw new ForbiddenError(
        'Only the comment author can delete this comment',
      );
    }

    await this.cardCommentsRepository.softDelete(commentId, cardId);
  }
}
