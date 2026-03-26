import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { WorkflowStepTypeValue, WorkflowTriggerType } from '@/entities/sales/workflow';
import type { WorkflowDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { workflowToDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { WorkflowsRepository } from '@/repositories/sales/workflows-repository';

interface UpdateWorkflowStepInput {
  order: number;
  type: WorkflowStepTypeValue;
  config: Record<string, unknown>;
}

interface UpdateWorkflowUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  description?: string;
  trigger?: WorkflowTriggerType;
  steps?: UpdateWorkflowStepInput[];
}

interface UpdateWorkflowUseCaseResponse {
  workflow: WorkflowDTO;
}

const VALID_TRIGGERS: WorkflowTriggerType[] = [
  'ORDER_CREATED', 'ORDER_CONFIRMED', 'DEAL_WON', 'DEAL_LOST',
  'CUSTOMER_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED',
];

const VALID_STEP_TYPES: WorkflowStepTypeValue[] = [
  'SEND_EMAIL', 'SEND_NOTIFICATION', 'UPDATE_STATUS', 'CREATE_TASK',
];

export class UpdateWorkflowUseCase {
  constructor(private workflowsRepository: WorkflowsRepository) {}

  async execute(
    input: UpdateWorkflowUseCaseRequest,
  ): Promise<UpdateWorkflowUseCaseResponse> {
    const workflow = await this.workflowsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!workflow) {
      throw new ResourceNotFoundError('Workflow not found.');
    }

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new BadRequestError('Workflow name cannot be empty.');
      }
      if (input.name.length > 255) {
        throw new BadRequestError('Workflow name cannot exceed 255 characters.');
      }
      workflow.name = input.name.trim();
    }

    if (input.description !== undefined) {
      workflow.description = input.description || undefined;
    }

    if (input.trigger !== undefined) {
      if (!VALID_TRIGGERS.includes(input.trigger)) {
        throw new BadRequestError(`Invalid trigger type: ${input.trigger}.`);
      }
      workflow.trigger = input.trigger;
    }

    if (input.steps !== undefined) {
      for (const step of input.steps) {
        if (!VALID_STEP_TYPES.includes(step.type)) {
          throw new BadRequestError(`Invalid step type: ${step.type}.`);
        }
        if (step.order < 1) {
          throw new BadRequestError('Step order must be at least 1.');
        }
      }

      const orders = input.steps.map((step) => step.order);
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== orders.length) {
        throw new BadRequestError('Step order values must be unique.');
      }

      workflow.steps = input.steps.map((step) => ({
        id: new UniqueEntityID(),
        workflowId: workflow.id,
        order: step.order,
        type: step.type,
        config: step.config,
        createdAt: new Date(),
      }));
    }

    await this.workflowsRepository.save(workflow);

    return {
      workflow: workflowToDTO(workflow),
    };
  }
}
