import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardAutomationRecord,
  BoardAutomationsRepository,
} from '@/repositories/tasks/board-automations-repository';

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
  ) {}

  async execute(
    request: ToggleAutomationRequest,
  ): Promise<ToggleAutomationResponse> {
    const { boardId, automationId, isActive } = request;

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
