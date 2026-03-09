import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Card } from '@/entities/tasks/card';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface CreateSubtaskRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  parentCardId: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: string;
  dueDate?: Date | null;
}

interface CreateSubtaskResponse {
  subtask: Card;
}

export class CreateSubtaskUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: CreateSubtaskRequest): Promise<CreateSubtaskResponse> {
    const {
      tenantId,
      boardId,
      userId,
      userName,
      parentCardId,
      title,
      description,
      assigneeId,
      priority,
      dueDate,
    } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const parentCard = await this.cardsRepository.findById(
      parentCardId,
      boardId,
    );

    if (!parentCard) {
      throw new ResourceNotFoundError('Parent card not found');
    }

    if (parentCard.parentCardId !== null) {
      throw new BadRequestError(
        'Cannot create a subtask of a subtask. Only one level of nesting is allowed.',
      );
    }

    const subtask = await this.cardsRepository.create({
      boardId,
      columnId: parentCard.columnId.toString(),
      parentCardId,
      title,
      description,
      assigneeId,
      priority,
      dueDate,
      reporterId: userId,
    });

    await this.cardActivitiesRepository.create({
      cardId: parentCardId,
      boardId,
      userId,
      type: 'SUBTASK_ADDED',
      description: `${userName} adicionou a sub-tarefa ${title} ao cartão ${parentCard.title}`,
    });

    return { subtask };
  }
}
