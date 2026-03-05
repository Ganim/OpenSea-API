import type {
  BoardCustomFieldsRepository,
  BoardCustomFieldRecord,
} from '@/repositories/tasks/board-custom-fields-repository';

interface ListCustomFieldsRequest {
  boardId: string;
}

interface ListCustomFieldsResponse {
  customFields: BoardCustomFieldRecord[];
}

export class ListCustomFieldsUseCase {
  constructor(
    private boardCustomFieldsRepository: BoardCustomFieldsRepository,
  ) {}

  async execute(
    request: ListCustomFieldsRequest,
  ): Promise<ListCustomFieldsResponse> {
    const { boardId } = request;

    const customFields =
      await this.boardCustomFieldsRepository.findByBoardId(boardId);

    return { customFields };
  }
}
