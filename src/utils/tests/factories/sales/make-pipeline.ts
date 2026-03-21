import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline, type PipelineProps } from '@/entities/sales/pipeline';

export function makePipeline(
  override: Partial<PipelineProps> = {},
  id?: UniqueEntityID,
): Pipeline {
  return Pipeline.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      name: override.name ?? 'Sales Pipeline',
      description: override.description,
      icon: override.icon,
      color: override.color,
      type: override.type ?? 'SALES',
      isDefault: override.isDefault,
      isActive: override.isActive,
      position: override.position,
      nextPipelineId: override.nextPipelineId,
      createdAt: override.createdAt,
      updatedAt: override.updatedAt,
      deletedAt: override.deletedAt,
    },
    id,
  );
}
