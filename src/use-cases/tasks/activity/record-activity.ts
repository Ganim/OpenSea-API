import type {
  CardActivitiesRepository,
  CardActivityRecord,
} from '@/repositories/tasks/card-activities-repository';

interface RecordActivityRequest {
  cardId: string;
  boardId: string;
  userId: string;
  type: string;
  description: string;
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown> | null;
}

interface RecordActivityResponse {
  activity: CardActivityRecord;
}

export class RecordActivityUseCase {
  constructor(private cardActivitiesRepository: CardActivitiesRepository) {}

  async execute(
    request: RecordActivityRequest,
  ): Promise<RecordActivityResponse> {
    const {
      cardId,
      boardId,
      userId,
      type,
      description,
      field,
      oldValue,
      newValue,
      metadata,
    } = request;

    const activity = await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type,
      description,
      field,
      oldValue,
      newValue,
      metadata,
    });

    return { activity };
  }
}
