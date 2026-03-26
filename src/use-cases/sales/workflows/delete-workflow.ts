import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { WorkflowsRepository } from '@/repositories/sales/workflows-repository';

interface DeleteWorkflowUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteWorkflowUseCaseResponse {
  message: string;
}

export class DeleteWorkflowUseCase {
  constructor(private workflowsRepository: WorkflowsRepository) {}

  async execute(
    input: DeleteWorkflowUseCaseRequest,
  ): Promise<DeleteWorkflowUseCaseResponse> {
    const workflow = await this.workflowsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!workflow) {
      throw new ResourceNotFoundError('Workflow not found.');
    }

    workflow.delete();
    await this.workflowsRepository.save(workflow);

    return {
      message: 'Workflow deleted successfully.',
    };
  }
}
