import type {
  BoardLabelsRepository,
  BoardLabelRecord,
} from '@/repositories/tasks/board-labels-repository';

interface ListLabelsRequest {
  boardId: string;
}

interface ListLabelsResponse {
  labels: BoardLabelRecord[];
}

export class ListLabelsUseCase {
  constructor(private boardLabelsRepository: BoardLabelsRepository) {}

  async execute(request: ListLabelsRequest): Promise<ListLabelsResponse> {
    const { boardId } = request;

    const labels = await this.boardLabelsRepository.findByBoardId(boardId);

    return { labels };
  }
}
