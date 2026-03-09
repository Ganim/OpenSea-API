import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardWatchersRepository } from '@/repositories/tasks/card-watchers-repository';

interface UnwatchCardRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
}

export class UnwatchCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardWatchersRepository: CardWatchersRepository,
  ) {}

  async execute(request: UnwatchCardRequest): Promise<void> {
    const { tenantId, userId, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const existing = await this.cardWatchersRepository.findByCardAndUser(
      cardId,
      userId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('User is not watching this card');
    }

    await this.cardWatchersRepository.delete(cardId, userId);
  }
}
