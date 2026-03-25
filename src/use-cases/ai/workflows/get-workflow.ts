import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import type { AiWorkflowExecutionsRepository } from '@/repositories/ai/ai-workflow-executions-repository';

interface GetWorkflowRequest {
  workflowId: string;
  tenantId: string;
}

export class GetWorkflowUseCase {
  constructor(
    private workflowsRepository: AiWorkflowsRepository,
    private executionsRepository: AiWorkflowExecutionsRepository,
  ) {}

  async execute(request: GetWorkflowRequest) {
    const workflow = await this.workflowsRepository.findById(
      request.workflowId,
      request.tenantId,
    );

    if (!workflow) {
      throw new Error('Workflow não encontrado.');
    }

    // Fetch recent executions
    const executionsResult = await this.executionsRepository.findMany({
      workflowId: request.workflowId,
      page: 1,
      limit: 10,
    });

    return {
      id: workflow.id.toString(),
      tenantId: workflow.tenantId.toString(),
      userId: workflow.userId.toString(),
      name: workflow.name,
      description: workflow.description,
      naturalPrompt: workflow.naturalPrompt,
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig,
      conditions: workflow.conditions,
      actions: workflow.actions,
      isActive: workflow.isActive,
      lastRunAt: workflow.lastRunAt,
      runCount: workflow.runCount,
      lastError: workflow.lastError,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      recentExecutions: executionsResult.executions.map((e) => ({
        id: e.id,
        status: e.status,
        trigger: e.trigger,
        error: e.error,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
      })),
    };
  }
}
