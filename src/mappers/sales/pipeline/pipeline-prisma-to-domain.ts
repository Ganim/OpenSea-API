import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';

export function pipelinePrismaToDomain(data: Record<string, unknown>): Pipeline {
  return Pipeline.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      name: data.name as string,
      description: (data.description as string) ?? undefined,
      icon: (data.icon as string) ?? undefined,
      color: (data.color as string) ?? undefined,
      type: data.type as string,
      isDefault: data.isDefault as boolean,
      position: data.position as number,
      nextPipelineId: data.nextPipelineId
        ? new UniqueEntityID(data.nextPipelineId as string)
        : undefined,
      isActive: data.isActive as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}
