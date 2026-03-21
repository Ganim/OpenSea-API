import { PrismaAiInsightsRepository } from '@/repositories/ai/prisma/prisma-ai-insights-repository';
import { DismissInsightUseCase } from '../dismiss-insight';

export function makeDismissInsightUseCase() {
  const insightsRepository = new PrismaAiInsightsRepository();
  return new DismissInsightUseCase(insightsRepository);
}
