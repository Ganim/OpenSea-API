import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AiInsight } from '@/entities/ai/ai-insight';
import type {
  AiInsightsRepository,
  CreateInsightData,
  FindManyInsightsOptions,
  FindManyInsightsResult,
} from '../ai-insights-repository';
import type {
  AiInsightStatus,
  AiInsightType,
  AiInsightPriority,
  AiInsight as PrismaAiInsight,
  Prisma,
} from '@prisma/generated/client.js';

function toDomain(raw: PrismaAiInsight): AiInsight {
  return AiInsight.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      type: raw.type,
      priority: raw.priority,
      title: raw.title,
      content: raw.content,
      renderData: raw.renderData as Record<string, unknown> | null,
      module: raw.module,
      relatedEntityType: raw.relatedEntityType,
      relatedEntityId: raw.relatedEntityId,
      targetUserIds: raw.targetUserIds,
      status: raw.status,
      actionUrl: raw.actionUrl,
      suggestedAction: raw.suggestedAction,
      expiresAt: raw.expiresAt,
      viewedAt: raw.viewedAt,
      actedOnAt: raw.actedOnAt,
      dismissedAt: raw.dismissedAt,
      aiModel: raw.aiModel,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaAiInsightsRepository implements AiInsightsRepository {
  async findById(id: string, tenantId: string): Promise<AiInsight | null> {
    const raw = await prisma.aiInsight.findFirst({
      where: { id, tenantId },
    });

    if (!raw) return null;
    return toDomain(raw);
  }

  async findMany(
    options: FindManyInsightsOptions,
  ): Promise<FindManyInsightsResult> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AiInsightWhereInput = {
      tenantId: options.tenantId,
    };

    if (options.userId) {
      where.targetUserIds = { has: options.userId };
    }

    if (options.status) {
      where.status = options.status as AiInsightStatus;
    }

    if (options.type) {
      where.type = options.type as AiInsightType;
    }

    if (options.priority) {
      where.priority = options.priority as AiInsightPriority;
    }

    if (options.module) {
      where.module = options.module;
    }

    const [insights, total] = await Promise.all([
      prisma.aiInsight.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.aiInsight.count({ where }),
    ]);

    return {
      insights: insights.map(toDomain),
      total,
    };
  }

  async create(data: CreateInsightData): Promise<AiInsight> {
    const raw = await prisma.aiInsight.create({
      data: {
        tenantId: data.tenantId,
        type: data.type as AiInsightType,
        priority: data.priority as AiInsightPriority,
        title: data.title,
        content: data.content,
        renderData: data.renderData
          ? JSON.parse(JSON.stringify(data.renderData))
          : undefined,
        module: data.module,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        targetUserIds: data.targetUserIds,
        status: 'NEW' as AiInsightStatus,
        actionUrl: data.actionUrl,
        suggestedAction: data.suggestedAction,
        expiresAt: data.expiresAt,
        aiModel: data.aiModel,
      },
    });

    return toDomain(raw);
  }

  async markViewed(id: string, tenantId: string): Promise<void> {
    await prisma.aiInsight.update({
      where: { id, tenantId },
      data: { status: 'VIEWED', viewedAt: new Date() },
    });
  }

  async markActedOn(id: string, tenantId: string): Promise<void> {
    await prisma.aiInsight.update({
      where: { id, tenantId },
      data: { status: 'ACTED_ON', actedOnAt: new Date() },
    });
  }

  async dismiss(id: string, tenantId: string): Promise<void> {
    await prisma.aiInsight.update({
      where: { id, tenantId },
      data: { status: 'DISMISSED', dismissedAt: new Date() },
    });
  }
}
