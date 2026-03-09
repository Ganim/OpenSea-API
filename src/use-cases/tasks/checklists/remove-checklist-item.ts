import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardChecklistsRepository } from '@/repositories/tasks/card-checklists-repository';

interface RemoveChecklistItemRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
  checklistId: string;
  itemId: string;
}

export class RemoveChecklistItemUseCase {
  constructor(private cardChecklistsRepository: CardChecklistsRepository) {}

  async execute(request: RemoveChecklistItemRequest): Promise<void> {
    const { checklistId, itemId } = request;

    const checklistItem = await this.cardChecklistsRepository.findItemById(
      itemId,
      checklistId,
    );

    if (!checklistItem) {
      throw new ResourceNotFoundError('Checklist item not found');
    }

    await this.cardChecklistsRepository.deleteItem(itemId, checklistId);
  }
}
