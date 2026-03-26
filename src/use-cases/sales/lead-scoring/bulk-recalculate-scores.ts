import { LeadScore } from '@/entities/sales/lead-score';
import type { LeadScoreFactor } from '@/entities/sales/lead-score';
import { CustomersRepository } from '@/repositories/sales/customers-repository';
import { LeadScoringRulesRepository } from '@/repositories/sales/lead-scoring-rules-repository';
import { LeadScoresRepository } from '@/repositories/sales/lead-scores-repository';

interface BulkRecalculateScoresUseCaseRequest {
  tenantId: string;
}

interface BulkRecalculateScoresUseCaseResponse {
  processedCount: number;
  message: string;
}

export class BulkRecalculateScoresUseCase {
  constructor(
    private leadScoringRulesRepository: LeadScoringRulesRepository,
    private leadScoresRepository: LeadScoresRepository,
    private customersRepository: CustomersRepository,
  ) {}

  async execute(
    input: BulkRecalculateScoresUseCaseRequest,
  ): Promise<BulkRecalculateScoresUseCaseResponse> {
    const activeRules =
      await this.leadScoringRulesRepository.findActiveByTenant(input.tenantId);

    const factors: LeadScoreFactor[] = activeRules.map((rule) => ({
      ruleId: rule.id.toString(),
      ruleName: rule.name,
      points: rule.points,
      reason: `${rule.field} ${rule.condition} ${rule.value}`,
    }));

    const totalScore = factors.reduce((sum, factor) => sum + factor.points, 0);
    const clampedScore = Math.max(0, Math.min(100, totalScore));
    const tier = LeadScore.determineTier(clampedScore);
    const calculatedAt = new Date();

    // Paginate through all customers
    let page = 1;
    const perPage = 100;
    let processedCount = 0;
    let hasMore = true;

    while (hasMore) {
      const customers = await this.customersRepository.findManyActive(
        page,
        perPage,
        input.tenantId,
      );

      for (const customer of customers) {
        await this.leadScoresRepository.upsert({
          tenantId: input.tenantId,
          customerId: customer.id.toString(),
          score: clampedScore,
          tier,
          factors,
          calculatedAt,
        });
        processedCount++;
      }

      hasMore = customers.length === perPage;
      page++;
    }

    return {
      processedCount,
      message: `Successfully recalculated scores for ${processedCount} customers.`,
    };
  }
}
