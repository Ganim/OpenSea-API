import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AiWorkflow } from '@/entities/ai/ai-workflow';
import type {
  AiWorkflowsRepository,
  CreateWorkflowSchema,
  UpdateWorkflowSchema,
  FindManyWorkflowsOptions,
  FindManyWorkflowsResult,
} from '../ai-workflows-repository';
import {
  type AiWorkflowTrigger,
  type Prisma,
  Prisma as PrismaNamespace,
} from '@prisma/generated/client.js';

interface RawWorkflow {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description: string;
  naturalPrompt: string;
  triggerType: string;
  triggerConfig: unknown;
  conditions: unknown;
  actions: unknown;
  isActive: boolean;
  lastRunAt: Date | null;
  runCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(raw: RawWorkflow): AiWorkflow {
  return AiWorkflow.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      userId: new UniqueEntityID(raw.userId),
      name: raw.name,
      description: raw.description,
      naturalPrompt: raw.naturalPrompt,
      triggerType: raw.triggerType as 'MANUAL' | 'CRON' | 'EVENT',
      triggerConfig: raw.triggerConfig as Record<string, unknown> | null,
      conditions: raw.conditions as AiWorkflow['conditions'],
      actions: (raw.actions as AiWorkflow['actions']) ?? [],
      isActive: raw.isActive,
      lastRunAt: raw.lastRunAt,
      runCount: raw.runCount,
      lastError: raw.lastError,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaAiWorkflowsRepository implements AiWorkflowsRepository {
  async create(data: CreateWorkflowSchema): Promise<AiWorkflow> {
    const raw = await prisma.aiWorkflow.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        name: data.name,
        description: data.description,
        naturalPrompt: data.naturalPrompt,
        triggerType: data.triggerType as AiWorkflowTrigger,
        triggerConfig:
          (data.triggerConfig as Prisma.InputJsonValue) ?? undefined,
        conditions: (data.conditions as Prisma.InputJsonValue) ?? undefined,
        actions: data.actions as Prisma.InputJsonValue,
      },
    });

    return toDomain(raw as unknown as RawWorkflow);
  }

  async findById(id: string, tenantId: string): Promise<AiWorkflow | null> {
    const raw = await prisma.aiWorkflow.findFirst({
      where: { id, tenantId },
    });

    if (!raw) return null;
    return toDomain(raw as unknown as RawWorkflow);
  }

  async findMany(
    options: FindManyWorkflowsOptions,
  ): Promise<FindManyWorkflowsResult> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AiWorkflowWhereInput = {
      tenantId: options.tenantId,
    };

    if (options.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options.triggerType) {
      where.triggerType = options.triggerType as AiWorkflowTrigger;
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [workflows, total] = await Promise.all([
      prisma.aiWorkflow.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.aiWorkflow.count({ where }),
    ]);

    return {
      workflows: (workflows as unknown as RawWorkflow[]).map(toDomain),
      total,
    };
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateWorkflowSchema,
  ): Promise<AiWorkflow> {
    const updateData: Prisma.AiWorkflowUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.triggerType !== undefined)
      updateData.triggerType = data.triggerType as AiWorkflowTrigger;
    if (data.triggerConfig !== undefined)
      updateData.triggerConfig =
        (data.triggerConfig as Prisma.InputJsonValue) ??
        PrismaNamespace.JsonNull;
    if (data.conditions !== undefined)
      updateData.conditions =
        (data.conditions as Prisma.InputJsonValue) ?? PrismaNamespace.JsonNull;
    if (data.actions !== undefined)
      updateData.actions = data.actions as Prisma.InputJsonValue;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.lastRunAt !== undefined) updateData.lastRunAt = data.lastRunAt;
    if (data.runCount !== undefined) updateData.runCount = data.runCount;
    if (data.lastError !== undefined) updateData.lastError = data.lastError;

    const raw = await prisma.aiWorkflow.update({
      where: { id, tenantId },
      data: updateData,
    });

    return toDomain(raw as unknown as RawWorkflow);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.aiWorkflow.delete({
      where: { id, tenantId },
    });
  }

  async findByTrigger(
    tenantId: string,
    triggerType: 'MANUAL' | 'CRON' | 'EVENT',
  ): Promise<AiWorkflow[]> {
    const workflows = await prisma.aiWorkflow.findMany({
      where: {
        tenantId,
        triggerType: triggerType as AiWorkflowTrigger,
        isActive: true,
      },
    });

    return (workflows as unknown as RawWorkflow[]).map(toDomain);
  }

  async findAllActiveByTrigger(
    triggerType: 'MANUAL' | 'CRON' | 'EVENT',
  ): Promise<AiWorkflow[]> {
    const workflows = await prisma.aiWorkflow.findMany({
      where: {
        triggerType: triggerType as AiWorkflowTrigger,
        isActive: true,
      },
    });

    return (workflows as unknown as RawWorkflow[]).map(toDomain);
  }
}
