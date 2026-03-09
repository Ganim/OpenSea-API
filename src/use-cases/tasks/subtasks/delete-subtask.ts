import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface DeleteSubtaskRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  subtaskId: string;
}

export class DeleteSubtaskUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: DeleteSubtaskRequest): Promise<void> {
    const { boardId, userId, userName, subtaskId } = request;

    const subtask = await this.cardsRepository.findById(subtaskId, boardId);

    if (!subtask) {
      throw new ResourceNotFoundError('Subtask not found');
    }

    if (!subtask.isSubtask || !subtask.parentCardId) {
      throw new BadRequestError('Card is not a subtask');
    }

    const parentCardId = subtask.parentCardId.toString();
    const parentCard = await this.cardsRepository.findById(parentCardId, boardId);

    await this.cardsRepository.softDelete(subtaskId, boardId);

    await this.cardActivitiesRepository.create({
      cardId: parentCardId,
      boardId,
      userId,
      type: 'SUBTASK_REMOVED',
      description: `${userName} removeu a sub-tarefa ${subtask.title} do cartão ${parentCard?.title ?? 'desconhecido'}`,
    });
  }
}
