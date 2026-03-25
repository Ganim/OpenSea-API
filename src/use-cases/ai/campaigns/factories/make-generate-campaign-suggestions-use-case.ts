import { PrismaAiInsightsRepository } from '@/repositories/ai/prisma/prisma-ai-insights-repository';
import { CampaignAnalyzer } from '@/services/ai-campaigns/campaign-analyzer';
import { makeAiRouter } from '@/services/ai-provider/make-ai-router';
import { GenerateCampaignSuggestionsUseCase } from '../generate-campaign-suggestions';

export function makeGenerateCampaignSuggestionsUseCase() {
  const aiRouter = makeAiRouter();
  const campaignAnalyzer = new CampaignAnalyzer(aiRouter);
  const insightsRepository = new PrismaAiInsightsRepository();

  return new GenerateCampaignSuggestionsUseCase(
    campaignAnalyzer,
    insightsRepository,
  );
}
