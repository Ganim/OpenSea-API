import { PrismaAiInsightsRepository } from '@/repositories/ai/prisma/prisma-ai-insights-repository';
import { ListInsightsUseCase } from '../list-insights';

export function makeListInsightsUseCase() {
  const insightsRepository = new PrismaAiInsightsRepository();
  return new ListInsightsUseCase(insightsRepository);
}
