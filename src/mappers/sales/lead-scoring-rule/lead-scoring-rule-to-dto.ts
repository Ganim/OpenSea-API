import type { LeadScoringRule } from '@/entities/sales/lead-scoring-rule';

export interface LeadScoringRuleDTO {
  id: string;
  name: string;
  field: string;
  condition: string;
  value: string;
  points: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export function leadScoringRuleToDTO(
  scoringRule: LeadScoringRule,
): LeadScoringRuleDTO {
  const dto: LeadScoringRuleDTO = {
    id: scoringRule.id.toString(),
    name: scoringRule.name,
    field: scoringRule.field,
    condition: scoringRule.condition,
    value: scoringRule.value,
    points: scoringRule.points,
    isActive: scoringRule.isActive,
    createdAt: scoringRule.createdAt,
  };

  if (scoringRule.updatedAt) dto.updatedAt = scoringRule.updatedAt;

  return dto;
}
