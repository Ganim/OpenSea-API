import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  CardWatcherRecord,
  CardWatchersRepository,
} from '@/repositories/tasks/card-watchers-repository';

interface ListCardWatchersRequest {
  tenantId: string;
  boardId: string;
  cardId: string;
}

interface ListCardWatchersResponse {
  watchers: CardWatcherRecord[];
}

export class ListCardWatchersUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardWatchersRepository: CardWatchersRepository,
  ) {}

  async execute(
    request: ListCardWatchersRequest,
  ): Promise<ListCardWatchersResponse> {
    const { tenantId, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const watchers = await this.cardWatchersRepository.findByCardId(cardId);

    return { watchers };
  }
}
