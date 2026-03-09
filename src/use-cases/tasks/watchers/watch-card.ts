import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  CardWatcherRecord,
  CardWatchersRepository,
} from '@/repositories/tasks/card-watchers-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface WatchCardRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
}

interface WatchCardResponse {
  watcher: CardWatcherRecord;
}

export class WatchCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private cardWatchersRepository: CardWatchersRepository,
  ) {}

  async execute(request: WatchCardRequest): Promise<WatchCardResponse> {
    const { tenantId, userId, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const existing = await this.cardWatchersRepository.findByCardAndUser(
      cardId,
      userId,
    );

    if (existing) {
      throw new BadRequestError('User is already watching this card');
    }

    const watcher = await this.cardWatchersRepository.create({
      cardId,
      userId,
      boardId,
    });

    return { watcher };
  }
}
