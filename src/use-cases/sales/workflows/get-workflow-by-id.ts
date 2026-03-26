import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkflowDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { workflowToDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { WorkflowsRepository } from '@/repositories/sales/workflows-repository';

interface GetWorkflowByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetWorkflowByIdUseCaseResponse {
  workflow: WorkflowDTO;
}

export class GetWorkflowByIdUseCase {
  constructor(private workflowsRepository: WorkflowsRepository) {}

  async execute(
    input: GetWorkflowByIdUseCaseRequest,
  ): Promise<GetWorkflowByIdUseCaseResponse> {
    const workflow = await this.workflowsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!workflow) {
      throw new ResourceNotFoundError('Workflow not found.');
    }

    return {
      workflow: workflowToDTO(workflow),
    };
  }
}
