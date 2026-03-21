import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardChecklistsRepository } from '@/repositories/tasks/card-checklists-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface RemoveChecklistItemRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  checklistId: string;
  itemId: string;
}

export class RemoveChecklistItemUseCase {
  constructor(
    private cardChecklistsRepository: CardChecklistsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: RemoveChecklistItemRequest): Promise<void> {
    const { userId, userName, boardId, cardId, checklistId, itemId } = request;

    const checklistItem = await this.cardChecklistsRepository.findItemById(
      itemId,
      checklistId,
    );

    if (!checklistItem) {
      throw new ResourceNotFoundError('Checklist item not found');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    await this.cardChecklistsRepository.deleteItem(itemId, checklistId);

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'FIELD_CHANGED',
      description: `${userName} removeu o item "${checklistItem.title}" de um checklist no cartão ${card?.title ?? ''}`,
    });
  }
}
