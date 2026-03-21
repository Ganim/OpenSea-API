import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';

interface ListInsightsRequest {
  tenantId: string;
  userId: string;
  status?: string;
  type?: string;
  priority?: string;
  module?: string;
  page?: number;
  limit?: number;
}

export class ListInsightsUseCase {
  constructor(private insightsRepository: AiInsightsRepository) {}

  async execute(request: ListInsightsRequest) {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { insights, total } = await this.insightsRepository.findMany({
      tenantId: request.tenantId,
      userId: request.userId,
      status: request.status,
      type: request.type,
      priority: request.priority,
      module: request.module,
      page,
      limit,
    });

    return {
      insights: insights.map((i) => ({
        id: i.id.toString(),
        tenantId: i.tenantId.toString(),
        type: i.type,
        priority: i.priority,
        title: i.title,
        content: i.content,
        renderData: i.renderData,
        module: i.module,
        relatedEntityType: i.relatedEntityType,
        relatedEntityId: i.relatedEntityId,
        status: i.status,
        actionUrl: i.actionUrl,
        suggestedAction: i.suggestedAction,
        expiresAt: i.expiresAt,
        viewedAt: i.viewedAt,
        actedOnAt: i.actedOnAt,
        dismissedAt: i.dismissedAt,
        createdAt: i.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
