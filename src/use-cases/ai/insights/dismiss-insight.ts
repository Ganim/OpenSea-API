import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';

interface DismissInsightRequest {
  tenantId: string;
  insightId: string;
}

export class DismissInsightUseCase {
  constructor(private insightsRepository: AiInsightsRepository) {}

  async execute(request: DismissInsightRequest) {
    const insight = await this.insightsRepository.findById(
      request.insightId,
      request.tenantId,
    );

    if (!insight) {
      throw new Error('Insight not found');
    }

    await this.insightsRepository.dismiss(request.insightId, request.tenantId);

    return { success: true };
  }
}
