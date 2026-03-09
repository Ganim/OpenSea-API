import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type {
  CardCommentsRepository,
  CardCommentRecord,
} from '@/repositories/tasks/card-comments-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface CreateCommentRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  content: string;
  mentions?: string[];
}

interface CreateCommentResponse {
  comment: CardCommentRecord;
}

export class CreateCommentUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private cardCommentsRepository: CardCommentsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: CreateCommentRequest): Promise<CreateCommentResponse> {
    const { boardId, userId, userName, cardId, content, mentions } = request;

    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Comment content is required');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const comment = await this.cardCommentsRepository.create({
      cardId,
      authorId: userId,
      content: content.trim(),
      mentions: mentions ?? null,
    });

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'COMMENTED',
      description: `${userName} comentou no cartão ${card.title}`,
    });

    return { comment };
  }
}
