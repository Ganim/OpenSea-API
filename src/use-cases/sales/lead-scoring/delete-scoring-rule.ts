import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LeadScoringRulesRepository } from '@/repositories/sales/lead-scoring-rules-repository';

interface DeleteScoringRuleUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteScoringRuleUseCaseResponse {
  message: string;
}

export class DeleteScoringRuleUseCase {
  constructor(private leadScoringRulesRepository: LeadScoringRulesRepository) {}

  async execute(
    input: DeleteScoringRuleUseCaseRequest,
  ): Promise<DeleteScoringRuleUseCaseResponse> {
    const scoringRule = await this.leadScoringRulesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!scoringRule) {
      throw new ResourceNotFoundError('Scoring rule not found.');
    }

    scoringRule.delete();
    await this.leadScoringRulesRepository.save(scoringRule);

    return {
      message: 'Scoring rule deleted successfully.',
    };
  }
}
