import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PipelineStage,
  type PipelineStageProps,
} from '@/entities/sales/pipeline-stage';

export function makePipelineStage(
  override: Partial<PipelineStageProps> = {},
  id?: UniqueEntityID,
): PipelineStage {
  return PipelineStage.create(
    {
      pipelineId: override.pipelineId ?? new UniqueEntityID('pipeline-1'),
      name: override.name ?? 'New Lead',
      color: override.color,
      icon: override.icon,
      position: override.position,
      type: override.type ?? 'OPEN',
      probability: override.probability,
      autoActions: override.autoActions,
      rottenAfterDays: override.rottenAfterDays,
      createdAt: override.createdAt,
      updatedAt: override.updatedAt,
    },
    id,
  );
}
