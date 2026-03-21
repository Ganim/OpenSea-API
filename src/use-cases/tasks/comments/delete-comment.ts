import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardCommentsRepository } from '@/repositories/tasks/card-comments-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface DeleteCommentRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  commentId: string;
  cardId: string;
}

export class DeleteCommentUseCase {
  constructor(
    private cardCommentsRepository: CardCommentsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: DeleteCommentRequest): Promise<void> {
    const { userId, userName, boardId, commentId, cardId } = request;

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

    const card = await this.cardsRepository.findById(cardId, boardId);

    await this.cardCommentsRepository.softDelete(commentId, cardId);

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'COMMENTED',
      description: `${userName} removeu um comentário do cartão ${card?.title ?? ''}`,
    });
  }
}
