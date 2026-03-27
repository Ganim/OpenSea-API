import type { BlueprintStageRule } from '@/entities/sales/blueprint-stage-rule';

export interface BlueprintStageRuleDTO {
  id: string;
  blueprintId: string;
  stageId: string;
  requiredFields: string[];
  validations: Array<{ field: string; condition: string; value: string }>;
  blocksAdvance: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export function blueprintStageRuleToDTO(
  rule: BlueprintStageRule,
): BlueprintStageRuleDTO {
  return {
    id: rule.id.toString(),
    blueprintId: rule.blueprintId.toString(),
    stageId: rule.stageId.toString(),
    requiredFields: rule.requiredFields,
    validations: rule.validations,
    blocksAdvance: rule.blocksAdvance,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt ?? null,
  };
}
