import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardAutomationRecord,
  BoardAutomationsRepository,
} from '@/repositories/tasks/board-automations-repository';

interface UpdateAutomationRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  automationId: string;
  name?: string;
  trigger?: string;
  triggerConfig?: Record<string, unknown>;
  action?: string;
  actionConfig?: Record<string, unknown>;
}

interface UpdateAutomationResponse {
  automation: BoardAutomationRecord;
}

export class UpdateAutomationUseCase {
  constructor(private boardAutomationsRepository: BoardAutomationsRepository) {}

  async execute(
    request: UpdateAutomationRequest,
  ): Promise<UpdateAutomationResponse> {
    const {
      boardId,
      automationId,
      name,
      trigger,
      triggerConfig,
      action,
      actionConfig,
    } = request;

    const existingAutomation = await this.boardAutomationsRepository.findById(
      automationId,
      boardId,
    );

    if (!existingAutomation) {
      throw new ResourceNotFoundError('Automation not found');
    }

    const updatedAutomation = await this.boardAutomationsRepository.update({
      id: automationId,
      boardId,
      name,
      trigger,
      triggerConfig,
      action,
      actionConfig,
    });

    if (!updatedAutomation) {
      throw new ResourceNotFoundError('Automation not found');
    }

    return { automation: updatedAutomation };
  }
}
