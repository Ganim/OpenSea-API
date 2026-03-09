import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Card } from '@/entities/tasks/card';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface UpdateSubtaskRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  subtaskId: string;
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: string;
  dueDate?: Date | null;
  status?: string;
}

interface UpdateSubtaskResponse {
  subtask: Card;
}

export class UpdateSubtaskUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: UpdateSubtaskRequest): Promise<UpdateSubtaskResponse> {
    const {
      boardId,
      userId,
      userName,
      subtaskId,
      title,
      description,
      assigneeId,
      priority,
      dueDate,
      status,
    } = request;

    const existingSubtask = await this.cardsRepository.findById(
      subtaskId,
      boardId,
    );

    if (!existingSubtask) {
      throw new ResourceNotFoundError('Subtask not found');
    }

    if (!existingSubtask.isSubtask) {
      throw new BadRequestError('Card is not a subtask');
    }

    const updatedSubtask = await this.cardsRepository.update({
      id: subtaskId,
      boardId,
      title,
      description,
      assigneeId,
      priority,
      dueDate,
      status,
    });

    if (!updatedSubtask) {
      throw new ResourceNotFoundError('Subtask not found after update');
    }

    const changedFields: string[] = [];
    if (title !== undefined) changedFields.push('title');
    if (description !== undefined) changedFields.push('description');
    if (assigneeId !== undefined) changedFields.push('assigneeId');
    if (priority !== undefined) changedFields.push('priority');
    if (dueDate !== undefined) changedFields.push('dueDate');
    if (status !== undefined) changedFields.push('status');

    await this.cardActivitiesRepository.create({
      cardId: subtaskId,
      boardId,
      userId,
      type: 'SUBTASK_UPDATED',
      description: `${userName} atualizou a sub-tarefa ${updatedSubtask.title}`,
      metadata: { changedFields },
    });

    return { subtask: updatedSubtask };
  }
}
