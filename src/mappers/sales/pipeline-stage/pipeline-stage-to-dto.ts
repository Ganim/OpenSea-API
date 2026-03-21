import type { PipelineStage } from '@/entities/sales/pipeline-stage';

export interface PipelineStageDTO {
  id: string;
  pipelineId: string;
  name: string;
  color: string | null;
  icon: string | null;
  position: number;
  type: string;
  probability: number | null;
  autoActions: Record<string, unknown> | null;
  rottenAfterDays: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function pipelineStageToDTO(stage: PipelineStage): PipelineStageDTO {
  return {
    id: stage.id.toString(),
    pipelineId: stage.pipelineId.toString(),
    name: stage.name,
    color: stage.color ?? null,
    icon: stage.icon ?? null,
    position: stage.position,
    type: stage.type,
    probability: stage.probability ?? null,
    autoActions: stage.autoActions ?? null,
    rottenAfterDays: stage.rottenAfterDays ?? null,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt ?? null,
  };
}
