import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';

interface ViewInsightRequest {
  tenantId: string;
  insightId: string;
}

export class ViewInsightUseCase {
  constructor(private insightsRepository: AiInsightsRepository) {}

  async execute(request: ViewInsightRequest) {
    const insight = await this.insightsRepository.findById(
      request.insightId,
      request.tenantId,
    );

    if (!insight) {
      throw new Error('Insight not found');
    }

    await this.insightsRepository.markViewed(
      request.insightId,
      request.tenantId,
    );

    return { success: true };
  }
}
