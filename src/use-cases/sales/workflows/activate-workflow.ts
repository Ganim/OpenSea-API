import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkflowDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { workflowToDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { WorkflowsRepository } from '@/repositories/sales/workflows-repository';

interface ActivateWorkflowUseCaseRequest {
  tenantId: string;
  id: string;
}

interface ActivateWorkflowUseCaseResponse {
  workflow: WorkflowDTO;
}

export class ActivateWorkflowUseCase {
  constructor(private workflowsRepository: WorkflowsRepository) {}

  async execute(
    input: ActivateWorkflowUseCaseRequest,
  ): Promise<ActivateWorkflowUseCaseResponse> {
    const workflow = await this.workflowsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!workflow) {
      throw new ResourceNotFoundError('Workflow not found.');
    }

    if (workflow.isActive) {
      throw new BadRequestError('Workflow is already active.');
    }

    if (workflow.steps.length === 0) {
      throw new BadRequestError('Cannot activate a workflow without steps.');
    }

    workflow.activate();
    await this.workflowsRepository.save(workflow);

    return {
      workflow: workflowToDTO(workflow),
    };
  }
}
