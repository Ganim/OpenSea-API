import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { WorkflowTriggerType } from '@/entities/sales/workflow';
import { WorkflowsRepository } from '@/repositories/sales/workflows-repository';

interface ExecutionStepLog {
  stepOrder: number;
  stepType: string;
  status: 'executed';
  message: string;
}

interface WorkflowExecutionLog {
  workflowId: string;
  workflowName: string;
  trigger: string;
  stepsExecuted: ExecutionStepLog[];
}

interface ExecuteWorkflowUseCaseRequest {
  tenantId: string;
  trigger: WorkflowTriggerType;
  context?: Record<string, unknown>;
}

interface ExecuteWorkflowUseCaseResponse {
  executionLogs: WorkflowExecutionLog[];
  totalWorkflowsExecuted: number;
}

export class ExecuteWorkflowUseCase {
  constructor(private workflowsRepository: WorkflowsRepository) {}

  async execute(
    input: ExecuteWorkflowUseCaseRequest,
  ): Promise<ExecuteWorkflowUseCaseResponse> {
    const activeWorkflows = await this.workflowsRepository.findByTrigger(
      input.trigger,
      input.tenantId,
    );

    if (activeWorkflows.length === 0) {
      throw new ResourceNotFoundError(
        `No active workflows found for trigger: ${input.trigger}.`,
      );
    }

    const executionLogs: WorkflowExecutionLog[] = [];

    for (const workflow of activeWorkflows) {
      const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);
      const stepsExecuted: ExecutionStepLog[] = [];

      for (const step of sortedSteps) {
        // MVP: log each step execution, actual integrations are future work
        let actionMessage = '';

        switch (step.type) {
          case 'SEND_EMAIL':
            actionMessage = `Email action logged for workflow "${workflow.name}" (config: ${JSON.stringify(step.config)})`;
            break;
          case 'SEND_NOTIFICATION':
            actionMessage = `Notification action logged for workflow "${workflow.name}" (config: ${JSON.stringify(step.config)})`;
            break;
          case 'UPDATE_STATUS':
            actionMessage = `Status update action logged for workflow "${workflow.name}" (config: ${JSON.stringify(step.config)})`;
            break;
          case 'CREATE_TASK':
            actionMessage = `Task creation action logged for workflow "${workflow.name}" (config: ${JSON.stringify(step.config)})`;
            break;
        }

        stepsExecuted.push({
          stepOrder: step.order,
          stepType: step.type,
          status: 'executed',
          message: actionMessage,
        });
      }

      // Record execution on the workflow
      workflow.recordExecution();
      await this.workflowsRepository.save(workflow);

      executionLogs.push({
        workflowId: workflow.id.toString(),
        workflowName: workflow.name,
        trigger: workflow.trigger,
        stepsExecuted,
      });
    }

    return {
      executionLogs,
      totalWorkflowsExecuted: executionLogs.length,
    };
  }
}
