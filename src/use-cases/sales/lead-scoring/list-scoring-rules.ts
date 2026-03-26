import type { LeadScoringRuleDTO } from '@/mappers/sales/lead-scoring-rule/lead-scoring-rule-to-dto';
import { leadScoringRuleToDTO } from '@/mappers/sales/lead-scoring-rule/lead-scoring-rule-to-dto';
import { LeadScoringRulesRepository } from '@/repositories/sales/lead-scoring-rules-repository';

interface ListScoringRulesUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
}

interface ListScoringRulesUseCaseResponse {
  scoringRules: LeadScoringRuleDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListScoringRulesUseCase {
  constructor(private leadScoringRulesRepository: LeadScoringRulesRepository) {}

  async execute(
    input: ListScoringRulesUseCaseRequest,
  ): Promise<ListScoringRulesUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [scoringRules, total] = await Promise.all([
      this.leadScoringRulesRepository.findMany(page, perPage, input.tenantId),
      this.leadScoringRulesRepository.countByTenant(input.tenantId),
    ]);

    return {
      scoringRules: scoringRules.map(leadScoringRuleToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
