import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type {
  CardChecklistRecord,
  CardChecklistsRepository,
} from '@/repositories/tasks/card-checklists-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface CreateChecklistRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  title: string;
}

interface CreateChecklistResponse {
  checklist: CardChecklistRecord;
}

export class CreateChecklistUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private cardChecklistsRepository: CardChecklistsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: CreateChecklistRequest,
  ): Promise<CreateChecklistResponse> {
    const { boardId, userId, userName, cardId, title } = request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Checklist title is required');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const existingChecklists =
      await this.cardChecklistsRepository.findByCardId(cardId);

    const nextPosition = existingChecklists.length;

    const checklist = await this.cardChecklistsRepository.create({
      cardId,
      title: title.trim(),
      position: nextPosition,
    });

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'FIELD_CHANGED',
      description: `${userName} adicionou o checklist "${title.trim()}" ao cartão ${card.title}`,
    });

    return { checklist };
  }
}
