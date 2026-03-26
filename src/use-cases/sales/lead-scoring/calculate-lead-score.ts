import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LeadScore } from '@/entities/sales/lead-score';
import type { LeadScoreFactor } from '@/entities/sales/lead-score';
import type { LeadScoreDTO } from '@/mappers/sales/lead-score/lead-score-to-dto';
import { leadScoreToDTO } from '@/mappers/sales/lead-score/lead-score-to-dto';
import { CustomersRepository } from '@/repositories/sales/customers-repository';
import { LeadScoringRulesRepository } from '@/repositories/sales/lead-scoring-rules-repository';
import { LeadScoresRepository } from '@/repositories/sales/lead-scores-repository';

interface CalculateLeadScoreUseCaseRequest {
  tenantId: string;
  customerId: string;
}

interface CalculateLeadScoreUseCaseResponse {
  leadScore: LeadScoreDTO;
}

export class CalculateLeadScoreUseCase {
  constructor(
    private leadScoringRulesRepository: LeadScoringRulesRepository,
    private leadScoresRepository: LeadScoresRepository,
    private customersRepository: CustomersRepository,
  ) {}

  async execute(
    input: CalculateLeadScoreUseCaseRequest,
  ): Promise<CalculateLeadScoreUseCaseResponse> {
    const customer = await this.customersRepository.findById(
      new UniqueEntityID(input.customerId),
      input.tenantId,
    );

    if (!customer) {
      throw new ResourceNotFoundError('Customer not found.');
    }

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

    const leadScore = await this.leadScoresRepository.upsert({
      tenantId: input.tenantId,
      customerId: input.customerId,
      score: clampedScore,
      tier,
      factors,
      calculatedAt,
    });

    return {
      leadScore: leadScoreToDTO(leadScore),
    };
  }
}
