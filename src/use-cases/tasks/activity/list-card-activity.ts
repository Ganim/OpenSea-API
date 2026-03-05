import type {
  CardActivitiesRepository,
  CardActivityRecord,
} from '@/repositories/tasks/card-activities-repository';

interface ListCardActivityRequest {
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
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: ListCardActivityRequest,
  ): Promise<ListCardActivityResponse> {
    const { cardId, type, page, limit } = request;

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
