import { PrismaAiInsightsRepository } from '@/repositories/ai/prisma/prisma-ai-insights-repository';
import { ViewInsightUseCase } from '../view-insight';

export function makeViewInsightUseCase() {
  const insightsRepository = new PrismaAiInsightsRepository();
  return new ViewInsightUseCase(insightsRepository);
}
