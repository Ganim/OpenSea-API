import type { AiWorkflowsRepository } from '@/repositories/ai/ai-workflows-repository';

interface ListWorkflowsRequest {
  tenantId: string;
  isActive?: boolean;
  triggerType?: 'MANUAL' | 'CRON' | 'EVENT';
  search?: string;
  page?: number;
  limit?: number;
}

export class ListWorkflowsUseCase {
  constructor(private workflowsRepository: AiWorkflowsRepository) {}

  async execute(request: ListWorkflowsRequest) {
    const result = await this.workflowsRepository.findMany({
      tenantId: request.tenantId,
      isActive: request.isActive,
      triggerType: request.triggerType,
      search: request.search,
      page: request.page,
      limit: request.limit,
    });

    return {
      data: result.workflows.map((w) => ({
        id: w.id.toString(),
        name: w.name,
        description: w.description,
        triggerType: w.triggerType,
        actions: w.actions,
        isActive: w.isActive,
        lastRunAt: w.lastRunAt,
        runCount: w.runCount,
        lastError: w.lastError,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
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
