import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  CardActivitiesRepository,
  CardActivityRecord,
} from '@/repositories/tasks/card-activities-repository';

interface ListCardActivityRequest {
  tenantId: string;
  boardId: string;
  cardId: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface ListCardActivityResponse {
  activities: CardActivityRecord[];
  total: number;
}

export class ListCardActivityUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: ListCardActivityRequest,
  ): Promise<ListCardActivityResponse> {
    const { tenantId, boardId, cardId, type, page, limit } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const { activities, total } =
      await this.cardActivitiesRepository.findByCardId({
        cardId,
        type,
        page,
        limit,
      });

    return { activities, total };
  }
}
