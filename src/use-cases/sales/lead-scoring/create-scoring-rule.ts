import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { LeadScoringRuleDTO } from '@/mappers/sales/lead-scoring-rule/lead-scoring-rule-to-dto';
import { leadScoringRuleToDTO } from '@/mappers/sales/lead-scoring-rule/lead-scoring-rule-to-dto';
import { LeadScoringRulesRepository } from '@/repositories/sales/lead-scoring-rules-repository';

interface CreateScoringRuleUseCaseRequest {
  tenantId: string;
  name: string;
  field: string;
  condition: string;
  value: string;
  points: number;
  isActive?: boolean;
}

interface CreateScoringRuleUseCaseResponse {
  scoringRule: LeadScoringRuleDTO;
}

export class CreateScoringRuleUseCase {
  constructor(private leadScoringRulesRepository: LeadScoringRulesRepository) {}

  async execute(
    input: CreateScoringRuleUseCaseRequest,
  ): Promise<CreateScoringRuleUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Scoring rule name is required.');
    }

    if (input.name.length > 255) {
      throw new BadRequestError(
        'Scoring rule name cannot exceed 255 characters.',
      );
    }

    if (!input.field || input.field.trim().length === 0) {
      throw new BadRequestError('Scoring rule field is required.');
    }

    if (!input.condition || input.condition.trim().length === 0) {
      throw new BadRequestError('Scoring rule condition is required.');
    }

    if (input.value === undefined || input.value === null) {
      throw new BadRequestError('Scoring rule value is required.');
    }

    if (input.points === 0) {
      throw new BadRequestError(
        'Points must be a non-zero integer (positive for boost, negative for penalty).',
      );
    }

    const scoringRule = await this.leadScoringRulesRepository.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      field: input.field.trim(),
      condition: input.condition.trim(),
      value: input.value.trim(),
      points: input.points,
      isActive: input.isActive,
    });

    return {
      scoringRule: leadScoringRuleToDTO(scoringRule),
    };
  }
}
