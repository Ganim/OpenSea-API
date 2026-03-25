import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';

interface UpdateWorkflowRequest {
  workflowId: string;
  tenantId: string;
  name?: string;
  description?: string;
  triggerType?: 'MANUAL' | 'CRON' | 'EVENT';
  triggerConfig?: Record<string, unknown> | null;
  conditions?: unknown[] | null;
  actions?: unknown[];
  isActive?: boolean;
}

export class UpdateWorkflowUseCase {
  constructor(private workflowsRepository: AiWorkflowsRepository) {}

  async execute(request: UpdateWorkflowRequest) {
    const workflow = await this.workflowsRepository.findById(
      request.workflowId,
      request.tenantId,
    );

    if (!workflow) {
      throw new Error('Workflow não encontrado.');
    }

    const updated = await this.workflowsRepository.update(
      request.workflowId,
      request.tenantId,
      {
        name: request.name,
        description: request.description,
        triggerType: request.triggerType,
        triggerConfig: request.triggerConfig,
        conditions: request.conditions,
        actions: request.actions,
        isActive: request.isActive,
      },
    );

    return {
      id: updated.id.toString(),
      name: updated.name,
      description: updated.description,
      triggerType: updated.triggerType,
      triggerConfig: updated.triggerConfig,
      conditions: updated.conditions,
      actions: updated.actions,
      isActive: updated.isActive,
      lastRunAt: updated.lastRunAt,
      runCount: updated.runCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
