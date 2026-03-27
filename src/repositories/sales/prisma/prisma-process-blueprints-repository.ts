import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import {
  BlueprintStageRule,
  type StageValidation,
} from '@/entities/sales/blueprint-stage-rule';
import { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import { prisma } from '@/lib/prisma';
import type {
  FindManyBlueprintsPaginatedParams,
  ProcessBlueprintsRepository,
} from '../process-blueprints-repository';
import type { PaginatedResult } from '@/repositories/pagination-params';

function mapStageRuleToDomain(
  data: Record<string, unknown>,
): BlueprintStageRule {
  return BlueprintStageRule.create(
    {
      blueprintId: new EntityID(data.blueprintId as string),
      stageId: new EntityID(data.stageId as string),
      requiredFields: (data.requiredFields as string[]) ?? [],
      validations: (data.validations as StageValidation[]) ?? [],
      blocksAdvance: data.blocksAdvance as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

function mapToDomain(
  data: Record<string, unknown>,
  stageRulesData?: Record<string, unknown>[],
): ProcessBlueprint {
  const stageRules = stageRulesData
    ? stageRulesData.map(mapStageRuleToDomain)
    : [];

  return ProcessBlueprint.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      pipelineId: new EntityID(data.pipelineId as string),
      isActive: data.isActive as boolean,
      stageRules,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaProcessBlueprintsRepository
  implements ProcessBlueprintsRepository
{
  async create(blueprint: ProcessBlueprint): Promise<void> {
    await prisma.processBlueprint.create({
      data: {
        id: blueprint.id.toString(),
        tenantId: blueprint.tenantId.toString(),
        name: blueprint.name,
        pipelineId: blueprint.pipelineId.toString(),
        isActive: blueprint.isActive,
        createdAt: blueprint.createdAt,
        stages: {
          create: blueprint.stageRules.map((rule) => ({
            id: rule.id.toString(),
            stageId: rule.stageId.toString(),
            requiredFields: rule.requiredFields,
            validations: JSON.parse(JSON.stringify(rule.validations)),
            blocksAdvance: rule.blocksAdvance,
          })),
        },
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProcessBlueprint | null> {
    const data = await prisma.processBlueprint.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      include: { stages: true },
    });

    if (!data) return null;

    return mapToDomain(
      data as unknown as Record<string, unknown>,
      data.stages as unknown as Record<string, unknown>[],
    );
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<ProcessBlueprint | null> {
    const data = await prisma.processBlueprint.findFirst({
      where: {
        name,
        tenantId,
        deletedAt: null,
      },
      include: { stages: true },
    });

    if (!data) return null;

    return mapToDomain(
      data as unknown as Record<string, unknown>,
      data.stages as unknown as Record<string, unknown>[],
    );
  }

  async findActiveByPipelineId(
    pipelineId: string,
    tenantId: string,
  ): Promise<ProcessBlueprint | null> {
    const data = await prisma.processBlueprint.findFirst({
      where: {
        pipelineId,
        tenantId,
        isActive: true,
        deletedAt: null,
      },
      include: { stages: true },
    });

    if (!data) return null;

    return mapToDomain(
      data as unknown as Record<string, unknown>,
      data.stages as unknown as Record<string, unknown>[],
    );
  }

  async findManyPaginated(
    params: FindManyBlueprintsPaginatedParams,
  ): Promise<PaginatedResult<ProcessBlueprint>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.pipelineId) {
      where.pipelineId = params.pipelineId;
    }

    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prisma.processBlueprint.findMany({
        where,
        include: { stages: true },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.processBlueprint.count({ where }),
    ]);

    const blueprints = items.map((item) =>
      mapToDomain(
        item as unknown as Record<string, unknown>,
        item.stages as unknown as Record<string, unknown>[],
      ),
    );

    return {
      data: blueprints,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(blueprint: ProcessBlueprint): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.processBlueprint.update({
        where: { id: blueprint.id.toString() },
        data: {
          name: blueprint.name,
          isActive: blueprint.isActive,
          deletedAt: blueprint.deletedAt ?? null,
        },
      });

      // Delete existing stage rules and recreate
      await tx.blueprintStageRule.deleteMany({
        where: { blueprintId: blueprint.id.toString() },
      });

      if (blueprint.stageRules.length > 0) {
        await tx.blueprintStageRule.createMany({
          data: blueprint.stageRules.map((rule) => ({
            id: rule.id.toString(),
            blueprintId: blueprint.id.toString(),
            stageId: rule.stageId.toString(),
            requiredFields: rule.requiredFields,
            validations: JSON.parse(JSON.stringify(rule.validations)),
            blocksAdvance: rule.blocksAdvance,
          })),
        });
      }
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.processBlueprint.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
