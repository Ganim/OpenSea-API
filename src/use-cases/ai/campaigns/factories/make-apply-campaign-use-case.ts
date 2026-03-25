import { PrismaAiInsightsRepository } from '@/repositories/ai/prisma/prisma-ai-insights-repository';
import { ToolExecutor } from '@/services/ai-tools/tool-executor';
import { ToolUseCaseFactory } from '@/services/ai-tools/tool-use-case-factory';
import { makeToolRegistry } from '@/services/ai-tools/make-tool-registry';
import { ApplyCampaignUseCase } from '../apply-campaign';

export function makeApplyCampaignUseCase() {
  const insightsRepository = new PrismaAiInsightsRepository();
  const toolRegistry = makeToolRegistry();
  const toolFactory = new ToolUseCaseFactory();
  const toolExecutor = new ToolExecutor(toolRegistry, toolFactory);

  return new ApplyCampaignUseCase(insightsRepository, toolExecutor);
}
