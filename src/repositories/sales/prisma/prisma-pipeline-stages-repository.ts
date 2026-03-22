import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { PipelineStage } from '@/entities/sales/pipeline-stage';
import { prisma } from '@/lib/prisma';
import type { PipelineStagesRepository } from '../pipeline-stages-repository';
import type { PipelineStageType as PrismaStageType } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): PipelineStage {
  return PipelineStage.create(
    {
      pipelineId: new EntityID(data.pipelineId as string),
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
    new EntityID(data.id as string),
  );
}

export class PrismaPipelineStagesRepository
  implements PipelineStagesRepository
{
  async create(stage: PipelineStage): Promise<void> {
    await prisma.crmPipelineStage.create({
      data: {
        id: stage.id.toString(),
        pipelineId: stage.pipelineId.toString(),
        name: stage.name,
        color: stage.color,
        icon: stage.icon,
        position: stage.position,
        type: stage.type as PrismaStageType,
        probability: stage.probability,
        autoActions: (stage.autoActions ?? undefined) as any,
        rottenAfterDays: stage.rottenAfterDays,
        createdAt: stage.createdAt,
      },
    });
  }

  async findById(id: UniqueEntityID): Promise<PipelineStage | null> {
    const data = await prisma.crmPipelineStage.findFirst({
      where: { id: id.toString() },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyByPipeline(
    pipelineId: UniqueEntityID,
  ): Promise<PipelineStage[]> {
    const items = await prisma.crmPipelineStage.findMany({
      where: { pipelineId: pipelineId.toString() },
      orderBy: { position: 'asc' },
    });

    return items.map((d) =>
      mapToDomain(d as unknown as Record<string, unknown>),
    );
  }

  async save(stage: PipelineStage): Promise<void> {
    await prisma.crmPipelineStage.update({
      where: { id: stage.id.toString() },
      data: {
        name: stage.name,
        color: stage.color,
        icon: stage.icon,
        position: stage.position,
        type: stage.type as PrismaStageType,
        probability: stage.probability,
        autoActions: (stage.autoActions ?? undefined) as any,
        rottenAfterDays: stage.rottenAfterDays,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.crmPipelineStage.delete({
      where: { id: id.toString() },
    });
  }

  async reorder(pipelineId: UniqueEntityID, stageIds: string[]): Promise<void> {
    const updates = stageIds.map((stageId, index) =>
      prisma.crmPipelineStage.update({
        where: { id: stageId },
        data: { position: index },
      }),
    );

    await prisma.$transaction(updates);
  }
}
