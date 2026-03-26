import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LeadScoringRuleDTO } from '@/mappers/sales/lead-scoring-rule/lead-scoring-rule-to-dto';
import { leadScoringRuleToDTO } from '@/mappers/sales/lead-scoring-rule/lead-scoring-rule-to-dto';
import { LeadScoringRulesRepository } from '@/repositories/sales/lead-scoring-rules-repository';

interface UpdateScoringRuleUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  field?: string;
  condition?: string;
  value?: string;
  points?: number;
  isActive?: boolean;
}

interface UpdateScoringRuleUseCaseResponse {
  scoringRule: LeadScoringRuleDTO;
}

export class UpdateScoringRuleUseCase {
  constructor(private leadScoringRulesRepository: LeadScoringRulesRepository) {}

  async execute(
    input: UpdateScoringRuleUseCaseRequest,
  ): Promise<UpdateScoringRuleUseCaseResponse> {
    const scoringRule = await this.leadScoringRulesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!scoringRule) {
      throw new ResourceNotFoundError('Scoring rule not found.');
    }

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new BadRequestError('Scoring rule name cannot be empty.');
      }
      if (input.name.length > 255) {
        throw new BadRequestError(
          'Scoring rule name cannot exceed 255 characters.',
        );
      }
      scoringRule.name = input.name.trim();
    }

    if (input.field !== undefined) {
      if (input.field.trim().length === 0) {
        throw new BadRequestError('Scoring rule field cannot be empty.');
      }
      scoringRule.field = input.field.trim();
    }

    if (input.condition !== undefined) {
      if (input.condition.trim().length === 0) {
        throw new BadRequestError('Scoring rule condition cannot be empty.');
      }
      scoringRule.condition = input.condition.trim();
    }

    if (input.value !== undefined) {
      scoringRule.value = input.value.trim();
    }

    if (input.points !== undefined) {
      if (input.points === 0) {
        throw new BadRequestError(
          'Points must be a non-zero integer (positive for boost, negative for penalty).',
        );
      }
      scoringRule.points = input.points;
    }

    if (input.isActive !== undefined) {
      scoringRule.isActive = input.isActive;
    }

    await this.leadScoringRulesRepository.save(scoringRule);

    return {
      scoringRule: leadScoringRuleToDTO(scoringRule),
    };
  }
}
