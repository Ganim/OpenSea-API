import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  CardActivitiesRepository,
  CardActivityRecord,
} from '@/repositories/tasks/card-activities-repository';

interface ListBoardActivityRequest {
  tenantId: string;
  boardId: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface ListBoardActivityResponse {
  activities: CardActivityRecord[];
  total: number;
}

export class ListBoardActivityUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: ListBoardActivityRequest,
  ): Promise<ListBoardActivityResponse> {
    const { tenantId, boardId, type, page, limit } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const { activities, total } =
      await this.cardActivitiesRepository.findByBoardId({
        boardId,
        type,
        page,
        limit,
      });

    return { activities, total };
  }
}
