import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';
import type { AiWorkflowExecutionsRepository } from '@/repositories/ai/ai-workflow-executions-repository';

interface ListWorkflowExecutionsRequest {
  workflowId: string;
  tenantId: string;
  page?: number;
  limit?: number;
}

export class ListWorkflowExecutionsUseCase {
  constructor(
    private workflowsRepository: AiWorkflowsRepository,
    private executionsRepository: AiWorkflowExecutionsRepository,
  ) {}

  async execute(request: ListWorkflowExecutionsRequest) {
    // Verify workflow belongs to tenant
    const workflow = await this.workflowsRepository.findById(
      request.workflowId,
      request.tenantId,
    );

    if (!workflow) {
      throw new Error('Workflow não encontrado.');
    }

    const result = await this.executionsRepository.findMany({
      workflowId: request.workflowId,
      page: request.page,
      limit: request.limit,
    });

    return {
      data: result.executions.map((e) => ({
        id: e.id,
        workflowId: e.workflowId,
        status: e.status,
        trigger: e.trigger,
        results: e.results,
        error: e.error,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
      })),
      meta: {
        total: result.total,
        page: request.page ?? 1,
        limit: request.limit ?? 20,
        pages: Math.ceil(result.total / (request.limit ?? 20)),
      },
    };
  }
}
