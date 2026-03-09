import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardChecklistsRepository } from '@/repositories/tasks/card-checklists-repository';

interface DeleteChecklistRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  checklistId: string;
}

export class DeleteChecklistUseCase {
  constructor(
    private cardChecklistsRepository: CardChecklistsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: DeleteChecklistRequest): Promise<void> {
    const { boardId, userId, userName, cardId, checklistId } = request;

    const checklist = await this.cardChecklistsRepository.findById(
      checklistId,
      cardId,
    );

    if (!checklist) {
      throw new ResourceNotFoundError('Checklist not found');
    }

    await this.cardChecklistsRepository.delete(checklistId, cardId);

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'FIELD_CHANGED',
      description: `${userName} removeu o checklist "${checklist.title}"`,
    });
  }
}
