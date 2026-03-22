import type { Pipeline } from '@/entities/sales/pipeline';
import type { PipelineStage } from '@/entities/sales/pipeline-stage';
import {
  pipelineStageToDTO,
  type PipelineStageDTO,
} from '../pipeline-stage/pipeline-stage-to-dto';

export interface PipelineDTO {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  type: string;
  isDefault: boolean;
  position: number;
  nextPipelineId: string | null;
  isActive: boolean;
  stages?: PipelineStageDTO[];
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export function pipelineToDTO(
  pipeline: Pipeline,
  stages?: PipelineStage[],
): PipelineDTO {
  return {
    id: pipeline.id.toString(),
    tenantId: pipeline.tenantId.toString(),
    name: pipeline.name,
    description: pipeline.description ?? null,
    icon: pipeline.icon ?? null,
    color: pipeline.color ?? null,
    type: pipeline.type,
    isDefault: pipeline.isDefault,
    position: pipeline.position,
    nextPipelineId: pipeline.nextPipelineId?.toString() ?? null,
    isActive: pipeline.isActive,
    stages: stages ? stages.map(pipelineStageToDTO) : undefined,
    createdAt: pipeline.createdAt,
    updatedAt: pipeline.updatedAt ?? null,
    deletedAt: pipeline.deletedAt ?? null,
  };
}
