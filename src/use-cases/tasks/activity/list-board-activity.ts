import type {
  CardActivitiesRepository,
  CardActivityRecord,
} from '@/repositories/tasks/card-activities-repository';

interface ListBoardActivityRequest {
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
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: ListBoardActivityRequest,
  ): Promise<ListBoardActivityResponse> {
    const { boardId, type, page, limit } = request;

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
