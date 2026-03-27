import type { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import {
  blueprintStageRuleToDTO,
  type BlueprintStageRuleDTO,
} from '../blueprint-stage-rule/blueprint-stage-rule-to-dto';

export interface ProcessBlueprintDTO {
  id: string;
  tenantId: string;
  name: string;
  pipelineId: string;
  isActive: boolean;
  stageRules: BlueprintStageRuleDTO[];
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export function processBlueprintToDTO(
  blueprint: ProcessBlueprint,
): ProcessBlueprintDTO {
  return {
    id: blueprint.id.toString(),
    tenantId: blueprint.tenantId.toString(),
    name: blueprint.name,
    pipelineId: blueprint.pipelineId.toString(),
    isActive: blueprint.isActive,
    stageRules: blueprint.stageRules.map(blueprintStageRuleToDTO),
    createdAt: blueprint.createdAt,
    updatedAt: blueprint.updatedAt ?? null,
    deletedAt: blueprint.deletedAt ?? null,
  };
}
