import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  ChecklistItemRecord,
  CardChecklistsRepository,
} from '@/repositories/tasks/card-checklists-repository';

interface AddChecklistItemRequest {
  tenantId: string;
  userId: string;
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
  constructor(private cardChecklistsRepository: CardChecklistsRepository) {}

  async execute(
    request: AddChecklistItemRequest,
  ): Promise<AddChecklistItemResponse> {
    const { cardId, checklistId, title, assigneeId, dueDate } = request;

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

    return { checklistItem };
  }
}
