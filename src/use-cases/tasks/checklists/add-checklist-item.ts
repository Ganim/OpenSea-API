import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type {
  ChecklistItemRecord,
  CardChecklistsRepository,
} from '@/repositories/tasks/card-checklists-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface AddChecklistItemRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  checklistId: string;
  title: string;
  assigneeId?: string | null;
  dueDate?: Date | null;
}

interface AddChecklistItemResponse {
  checklistItem: ChecklistItemRecord;
}

export class AddChecklistItemUseCase {
  constructor(
    private cardChecklistsRepository: CardChecklistsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: AddChecklistItemRequest,
  ): Promise<AddChecklistItemResponse> {
    const {
      userId,
      userName,
      boardId,
      cardId,
      checklistId,
      title,
      assigneeId,
      dueDate,
    } = request;

    const checklist = await this.cardChecklistsRepository.findById(
      checklistId,
      cardId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Checklist not found');
    }

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Checklist item title is required');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    const existingItems =
      await this.cardChecklistsRepository.findItemsByChecklistId(checklistId);

    const nextPosition = existingItems.length;

    const checklistItem = await this.cardChecklistsRepository.addItem({
      checklistId,
      title: title.trim(),
      assigneeId,
      dueDate,
      position: nextPosition,
    });

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'FIELD_CHANGED',
      description: `${userName} adicionou o item "${title.trim()}" ao checklist "${checklist.title}" no cartão ${card?.title ?? ''}`,
    });

    return { checklistItem };
  }
}
