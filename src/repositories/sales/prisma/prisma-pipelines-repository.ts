import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Pipeline } from '@/entities/sales/pipeline';
import { prisma } from '@/lib/prisma';
import type { PipelinesRepository } from '../pipelines-repository';
import type { PipelineType as PrismaPipelineType } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): Pipeline {
  return Pipeline.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      description: (data.description as string) ?? undefined,
      icon: (data.icon as string) ?? undefined,
      color: (data.color as string) ?? undefined,
      type: data.type as string,
      isDefault: data.isDefault as boolean,
      position: data.position as number,
      nextPipelineId: data.nextPipelineId
        ? new EntityID(data.nextPipelineId as string)
        : undefined,
      isActive: data.isActive as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaPipelinesRepository implements PipelinesRepository {
  async create(pipeline: Pipeline): Promise<void> {
    await prisma.crmPipeline.create({
      data: {
        id: pipeline.id.toString(),
        tenantId: pipeline.tenantId.toString(),
        name: pipeline.name,
        description: pipeline.description,
        icon: pipeline.icon,
        color: pipeline.color,
        type: pipeline.type as PrismaPipelineType,
        isDefault: pipeline.isDefault,
        position: pipeline.position,
        nextPipelineId: pipeline.nextPipelineId?.toString(),
        isActive: pipeline.isActive,
        createdAt: pipeline.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Pipeline | null> {
    const data = await prisma.crmPipeline.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findByName(name: string, tenantId: string): Promise<Pipeline | null> {
    const data = await prisma.crmPipeline.findFirst({
      where: {
        name,
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findMany(tenantId: string): Promise<Pipeline[]> {
    const items = await prisma.crmPipeline.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { position: 'asc' },
    });

    return items.map((d) =>
      mapToDomain(d as unknown as Record<string, unknown>),
    );
  }

  async save(pipeline: Pipeline): Promise<void> {
    await prisma.crmPipeline.update({
      where: { id: pipeline.id.toString() },
      data: {
        name: pipeline.name,
        description: pipeline.description,
        icon: pipeline.icon,
        color: pipeline.color,
        isDefault: pipeline.isDefault,
        position: pipeline.position,
        nextPipelineId: pipeline.nextPipelineId?.toString() ?? null,
        isActive: pipeline.isActive,
        deletedAt: pipeline.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.crmPipeline.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
