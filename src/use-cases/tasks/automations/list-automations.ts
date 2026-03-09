import type {
  BoardAutomationRecord,
  BoardAutomationsRepository,
} from '@/repositories/tasks/board-automations-repository';

interface ListAutomationsRequest {
  tenantId: string;
  boardId: string;
}

interface ListAutomationsResponse {
  automations: BoardAutomationRecord[];
}

export class ListAutomationsUseCase {
  constructor(private boardAutomationsRepository: BoardAutomationsRepository) {}

  async execute(
    request: ListAutomationsRequest,
  ): Promise<ListAutomationsResponse> {
    const { boardId } = request;

    const automations =
      await this.boardAutomationsRepository.findByBoardId(boardId);

    return { automations };
  }
}
