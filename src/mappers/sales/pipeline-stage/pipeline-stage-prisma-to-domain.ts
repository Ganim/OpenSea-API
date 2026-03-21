import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';

export function pipelineStagePrismaToDomain(
  data: Record<string, unknown>,
): PipelineStage {
  return PipelineStage.create(
    {
      pipelineId: new UniqueEntityID(data.pipelineId as string),
      name: data.name as string,
      color: (data.color as string) ?? undefined,
      icon: (data.icon as string) ?? undefined,
      position: data.position as number,
      type: data.type as string,
      probability: (data.probability as number) ?? undefined,
      autoActions: (data.autoActions as Record<string, unknown>) ?? undefined,
      rottenAfterDays: (data.rottenAfterDays as number) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}
