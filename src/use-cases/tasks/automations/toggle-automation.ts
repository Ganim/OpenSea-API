import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardAutomationRecord,
  BoardAutomationsRepository,
} from '@/repositories/tasks/board-automations-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface ToggleAutomationRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  automationId: string;
  isActive: boolean;
}

interface ToggleAutomationResponse {
  automation: BoardAutomationRecord;
}

export class ToggleAutomationUseCase {
  constructor(
    private boardAutomationsRepository: BoardAutomationsRepository,
    private boardsRepository: BoardsRepository,
  ) {}

  async execute(
    request: ToggleAutomationRequest,
  ): Promise<ToggleAutomationResponse> {
    const { tenantId, boardId, automationId, isActive } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const existingAutomation =
      await this.boardAutomationsRepository.findById(automationId, boardId);

    if (!existingAutomation) {
      throw new ResourceNotFoundError('Automation not found');
    }

    const updatedAutomation = await this.boardAutomationsRepository.update({
      id: automationId,
      boardId,
      isActive,
    });

    if (!updatedAutomation) {
      throw new ResourceNotFoundError('Automation not found');
    }

    return { automation: updatedAutomation };
  }
}
