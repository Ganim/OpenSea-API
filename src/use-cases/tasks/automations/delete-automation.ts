import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardAutomationsRepository } from '@/repositories/tasks/board-automations-repository';

interface DeleteAutomationRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  automationId: string;
}

export class DeleteAutomationUseCase {
  constructor(private boardAutomationsRepository: BoardAutomationsRepository) {}

  async execute(request: DeleteAutomationRequest): Promise<void> {
    const { boardId, automationId } = request;

    const existingAutomation = await this.boardAutomationsRepository.findById(
      automationId,
      boardId,
    );

    if (!existingAutomation) {
      throw new ResourceNotFoundError('Automation not found');
    }

    await this.boardAutomationsRepository.delete(automationId, boardId);
  }
}
