import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsGoal } from '@/entities/sales/analytics-goal';
import { prisma } from '@/lib/prisma';
import type {
  AnalyticsGoalsRepository,
  CreateAnalyticsGoalSchema,
  UpdateAnalyticsGoalSchema,
} from '../analytics-goals-repository';
import type {
  GoalType,
  GoalPeriod,
  GoalScope,
  GoalStatus,
} from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): AnalyticsGoal {
  return AnalyticsGoal.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      type: data.type as string,
      targetValue: Number(data.targetValue),
      currentValue: Number(data.currentValue),
      unit: data.unit as string,
      period: data.period as string,
      startDate: data.startDate as Date,
      endDate: data.endDate as Date,
      scope: data.scope as string,
      userId: (data.userId as string) ?? undefined,
      teamId: (data.teamId as string) ?? undefined,
      status: data.status as string,
      achievedAt: (data.achievedAt as Date) ?? undefined,
      createdByUserId: data.createdByUserId as string,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaAnalyticsGoalsRepository
  implements AnalyticsGoalsRepository
{
  async create(data: CreateAnalyticsGoalSchema): Promise<AnalyticsGoal> {
    const goal = await prisma.analyticsGoal.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type as GoalType,
        targetValue: data.targetValue,
        currentValue: data.currentValue ?? 0,
        unit: data.unit ?? 'BRL',
        period: data.period as GoalPeriod,
        startDate: data.startDate,
        endDate: data.endDate,
        scope: data.scope as GoalScope,
        userId: data.userId,
        teamId: data.teamId,
        status: (data.status as GoalStatus) ?? 'ACTIVE',
        createdByUserId: data.createdByUserId,
      },
    });

    return mapToDomain(goal as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<AnalyticsGoal | null> {
    const goal = await prisma.analyticsGoal.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    return goal
      ? mapToDomain(goal as unknown as Record<string, unknown>)
      : null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: {
      status?: string;
      type?: string;
      scope?: string;
      userId?: string;
    },
  ): Promise<AnalyticsGoal[]> {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.scope) where.scope = filters.scope;
    if (filters?.userId) where.userId = filters.userId;

    const goals = await prisma.analyticsGoal.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) =>
      mapToDomain(g as unknown as Record<string, unknown>),
    );
  }

  async countMany(
    tenantId: string,
    filters?: {
      status?: string;
      type?: string;
      scope?: string;
      userId?: string;
    },
  ): Promise<number> {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.scope) where.scope = filters.scope;
    if (filters?.userId) where.userId = filters.userId;

    return prisma.analyticsGoal.count({ where });
  }

  async update(data: UpdateAnalyticsGoalSchema): Promise<AnalyticsGoal | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.targetValue !== undefined)
      updateData.targetValue = data.targetValue;
    if (data.currentValue !== undefined)
      updateData.currentValue = data.currentValue;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;

    const goal = await prisma.analyticsGoal.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return mapToDomain(goal as unknown as Record<string, unknown>);
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.analyticsGoal.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }
}
