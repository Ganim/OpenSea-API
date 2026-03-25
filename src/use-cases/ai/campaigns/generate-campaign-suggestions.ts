import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';
import type {
  CampaignAnalyzer,
  CampaignSuggestion,
} from '@/services/ai-campaigns/campaign-analyzer';

interface GenerateCampaignSuggestionsRequest {
  tenantId: string;
  userId: string;
}

interface GenerateCampaignSuggestionsResponse {
  suggestions: CampaignSuggestion[];
  insightIds: string[];
  aiModel: string;
}

export class GenerateCampaignSuggestionsUseCase {
  constructor(
    private campaignAnalyzer: CampaignAnalyzer,
    private insightsRepository: AiInsightsRepository,
  ) {}

  async execute(
    request: GenerateCampaignSuggestionsRequest,
  ): Promise<GenerateCampaignSuggestionsResponse> {
    // Run the AI campaign analysis
    const result = await this.campaignAnalyzer.analyze({
      tenantId: request.tenantId,
      userId: request.userId,
      permissions: [],
      conversationId: '',
    });

    // Save each suggestion as an AiInsight
    const insightIds: string[] = [];

    for (const suggestion of result.suggestions) {
      const insightType =
        suggestion.type === 'LIQUIDATION' || suggestion.type === 'OVERSTOCK'
          ? 'OPPORTUNITY'
          : 'RECOMMENDATION';

      const insight = await this.insightsRepository.create({
        tenantId: request.tenantId,
        type: insightType,
        priority: suggestion.type === 'LIQUIDATION' ? 'HIGH' : 'MEDIUM',
        title: suggestion.title,
        content: suggestion.description,
        renderData: {
          campaignType: suggestion.type,
          targetProducts: suggestion.targetProducts,
          suggestedDiscount: suggestion.suggestedDiscount,
          estimatedImpact: suggestion.estimatedImpact,
          suggestedActions: suggestion.suggestedActions,
        },
        module: 'sales',
        targetUserIds: [request.userId],
        actionUrl: '/ai/campaigns',
        suggestedAction: `Aplicar campanha: ${suggestion.title}`,
        aiModel: result.aiModel,
      });

      insightIds.push(insight.id.toString());
    }

    return {
      suggestions: result.suggestions,
      insightIds,
      aiModel: result.aiModel,
    };
  }
}
