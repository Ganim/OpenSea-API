import { PrismaAiInsightsRepository } from '@/repositories/ai/prisma/prisma-ai-insights-repository';
import { GenerateInsightsUseCase } from '../generate-insights';

export function makeGenerateInsightsUseCase() {
  const insightsRepository = new PrismaAiInsightsRepository();
  return new GenerateInsightsUseCase(insightsRepository);
}
