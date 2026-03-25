import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';

interface DeleteWorkflowRequest {
  workflowId: string;
  tenantId: string;
}

export class DeleteWorkflowUseCase {
  constructor(private workflowsRepository: AiWorkflowsRepository) {}

  async execute(request: DeleteWorkflowRequest) {
    const workflow = await this.workflowsRepository.findById(
      request.workflowId,
      request.tenantId,
    );

    if (!workflow) {
      throw new Error('Workflow não encontrado.');
    }

    await this.workflowsRepository.delete(request.workflowId, request.tenantId);
  }
}
