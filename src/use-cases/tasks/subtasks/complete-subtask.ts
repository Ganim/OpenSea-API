import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Card } from '@/entities/tasks/card';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface CompleteSubtaskRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  subtaskId: string;
  completed: boolean;
}

interface CompleteSubtaskResponse {
  subtask: Card;
  allSubtasksDone: boolean;
}

export class CompleteSubtaskUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: CompleteSubtaskRequest,
  ): Promise<CompleteSubtaskResponse> {
    const { boardId, userId, userName, subtaskId, completed } = request;

    const subtask = await this.cardsRepository.findById(subtaskId, boardId);

    if (!subtask) {
      throw new ResourceNotFoundError('Subtask not found');
    }

    if (!subtask.isSubtask) {
      throw new BadRequestError('Card is not a subtask');
    }

    const parentCardId = subtask.parentCardId!.toString();
    const parentCard = await this.cardsRepository.findById(parentCardId, boardId);
    const parentTitle = parentCard?.title ?? 'desconhecido';

    if (completed) {
      subtask.complete();

      await this.cardsRepository.update({
        id: subtaskId,
        boardId,
        status: 'DONE',
      });

      await this.cardActivitiesRepository.create({
        cardId: parentCardId,
        boardId,
        userId,
        type: 'SUBTASK_COMPLETED',
        description: `${userName} concluiu a sub-tarefa ${subtask.title} do cartão ${parentTitle}`,
      });
    } else {
      subtask.status = 'OPEN';

      await this.cardsRepository.update({
        id: subtaskId,
        boardId,
        status: 'OPEN',
        completedAt: null,
      });

      await this.cardActivitiesRepository.create({
        cardId: parentCardId,
        boardId,
        userId,
        type: 'SUBTASK_REOPENED',
        description: `${userName} reabriu a sub-tarefa ${subtask.title} do cartão ${parentTitle}`,
      });
    }

    const siblingSubtasks = await this.cardsRepository.findSubtasks(parentCardId);

    const allSubtasksDone =
      siblingSubtasks.length > 0 &&
      siblingSubtasks.every((sibling) => {
        if (sibling.id.toString() === subtaskId) {
          return completed;
        }
        return sibling.isCompleted;
      });

    return {
      subtask,
      allSubtasksDone,
    };
  }
}
