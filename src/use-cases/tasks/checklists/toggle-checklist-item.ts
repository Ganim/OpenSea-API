import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type {
  ChecklistItemRecord,
  CardChecklistsRepository,
} from '@/repositories/tasks/card-checklists-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface ToggleChecklistItemRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  checklistId: string;
  itemId: string;
  isCompleted: boolean;
}

interface ToggleChecklistItemResponse {
  checklistItem: ChecklistItemRecord;
}

export class ToggleChecklistItemUseCase {
  constructor(
    private cardChecklistsRepository: CardChecklistsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: ToggleChecklistItemRequest,
  ): Promise<ToggleChecklistItemResponse> {
    const { boardId, userId, userName, cardId, checklistId, itemId, isCompleted } =
      request;

    const checklistItem = await this.cardChecklistsRepository.updateItem({
      id: itemId,
      checklistId,
      isCompleted,
    });

    if (!checklistItem) {
      throw new ResourceNotFoundError('Checklist item not found');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);
    const cardTitle = card?.title ?? 'desconhecido';

    const activityDescription = isCompleted
      ? `${userName} marcou ${checklistItem.title} como concluído no cartão ${cardTitle}`
      : `${userName} desmarcou ${checklistItem.title} no cartão ${cardTitle}`;

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: isCompleted ? 'CHECKLIST_ITEM_COMPLETED' : 'CHECKLIST_ITEM_UNCOMPLETED',
      description: activityDescription,
    });

    return { checklistItem };
  }
}
