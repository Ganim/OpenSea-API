import type {
  CardCommentsRepository,
  CardCommentRecord,
} from '@/repositories/tasks/card-comments-repository';

interface ListCommentsRequest {
  tenantId: string;
  cardId: string;
  page?: number;
  limit?: number;
}

interface ListCommentsResponse {
  comments: CardCommentRecord[];
  total: number;
}

export class ListCommentsUseCase {
  constructor(private cardCommentsRepository: CardCommentsRepository) {}

  async execute(request: ListCommentsRequest): Promise<ListCommentsResponse> {
    const { cardId, page, limit } = request;

    const { comments, total } = await this.cardCommentsRepository.findByCardId({
      cardId,
      includeDeleted: false,
      page,
      limit,
    });

    return { comments, total };
  }
}
