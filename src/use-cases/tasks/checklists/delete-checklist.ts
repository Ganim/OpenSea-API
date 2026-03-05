import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardChecklistsRepository } from '@/repositories/tasks/card-checklists-repository';

interface DeleteChecklistRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
  checklistId: string;
}

export class DeleteChecklistUseCase {
  constructor(
    private cardChecklistsRepository: CardChecklistsRepository,
  ) {}

  async execute(request: DeleteChecklistRequest): Promise<void> {
    const { cardId, checklistId } = request;

    const checklist = await this.cardChecklistsRepository.findById(
      checklistId,
      cardId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Checklist not found');
    }

    await this.cardChecklistsRepository.delete(checklistId, cardId);
  }
}
