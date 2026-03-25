import { prisma } from '@/lib/prisma';
import type { AiInsightsRepository } from '@/repositories/ai/ai-insights-repository';
import {
  InsightGenerator,
  type InsightGeneratorResult,
} from '@/services/ai-insights/insight-generator';

interface GenerateInsightsUseCaseRequest {
  tenantId: string;
  userId: string;
}

interface GenerateInsightsUseCaseResponse {
  result: InsightGeneratorResult;
}

export class GenerateInsightsUseCase {
  constructor(private insightsRepository: AiInsightsRepository) {}

  async execute(
    request: GenerateInsightsUseCaseRequest,
  ): Promise<GenerateInsightsUseCaseResponse> {
    const { tenantId, userId } = request;

    // Get all user IDs for this tenant to target with insights
    const tenantUsers = await prisma.tenantUser.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      select: { userId: true },
    });

    const targetUserIds = tenantUsers.map((tu) => tu.userId);

    // Ensure the requesting user is included
    if (!targetUserIds.includes(userId)) {
      targetUserIds.push(userId);
    }

    const generator = new InsightGenerator(this.insightsRepository);
    const result = await generator.generate(tenantId, targetUserIds);

    return { result };
  }
}
