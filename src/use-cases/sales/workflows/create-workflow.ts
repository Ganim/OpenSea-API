import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { WorkflowStepTypeValue, WorkflowTriggerType } from '@/entities/sales/workflow';
import type { WorkflowDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { workflowToDTO } from '@/mappers/sales/workflow/workflow-to-dto';
import { WorkflowsRepository } from '@/repositories/sales/workflows-repository';

interface CreateWorkflowStepInput {
  order: number;
  type: WorkflowStepTypeValue;
  config: Record<string, unknown>;
}

interface CreateWorkflowUseCaseRequest {
  tenantId: string;
  name: string;
  description?: string;
  trigger: WorkflowTriggerType;
  isActive?: boolean;
  steps?: CreateWorkflowStepInput[];
}

interface CreateWorkflowUseCaseResponse {
  workflow: WorkflowDTO;
}

const VALID_TRIGGERS: WorkflowTriggerType[] = [
  'ORDER_CREATED', 'ORDER_CONFIRMED', 'DEAL_WON', 'DEAL_LOST',
  'CUSTOMER_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED',
];

const VALID_STEP_TYPES: WorkflowStepTypeValue[] = [
  'SEND_EMAIL', 'SEND_NOTIFICATION', 'UPDATE_STATUS', 'CREATE_TASK',
];

export class CreateWorkflowUseCase {
  constructor(private workflowsRepository: WorkflowsRepository) {}

  async execute(
    input: CreateWorkflowUseCaseRequest,
  ): Promise<CreateWorkflowUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Workflow name is required.');
    }

    if (input.name.length > 255) {
      throw new BadRequestError('Workflow name cannot exceed 255 characters.');
    }

    if (!VALID_TRIGGERS.includes(input.trigger)) {
      throw new BadRequestError(`Invalid trigger type: ${input.trigger}.`);
    }

    if (input.steps) {
      for (const step of input.steps) {
        if (!VALID_STEP_TYPES.includes(step.type)) {
          throw new BadRequestError(`Invalid step type: ${step.type}.`);
        }
        if (step.order < 1) {
          throw new BadRequestError('Step order must be at least 1.');
        }
      }

      // Check for duplicate order values
      const orders = input.steps.map((step) => step.order);
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== orders.length) {
        throw new BadRequestError('Step order values must be unique.');
      }
    }

    const workflow = await this.workflowsRepository.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      description: input.description,
      trigger: input.trigger,
      isActive: input.isActive,
      steps: input.steps?.map((step) => ({
        order: step.order,
        type: step.type,
        config: step.config,
      })),
    });

    return {
      workflow: workflowToDTO(workflow),
    };
  }
}
