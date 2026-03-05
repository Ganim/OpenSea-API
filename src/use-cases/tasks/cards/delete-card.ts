import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface DeleteCardRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
}

export class DeleteCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: DeleteCardRequest): Promise<void> {
    const { tenantId, userId, userName, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const subtasks = await this.cardsRepository.findSubtasks(cardId);

    for (const subtask of subtasks) {
      await this.cardsRepository.softDelete(
        subtask.id.toString(),
        boardId,
      );
    }

    await this.cardsRepository.softDelete(cardId, boardId);

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'DELETED',
      description: `${userName} excluiu o cartão ${card.title}`,
    });
  }
}
