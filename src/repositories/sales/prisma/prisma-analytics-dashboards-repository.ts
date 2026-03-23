import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsDashboard } from '@/entities/sales/analytics-dashboard';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  AnalyticsDashboardsRepository,
  CreateAnalyticsDashboardSchema,
} from '../analytics-dashboards-repository';
import type {
  DashboardRole,
  DashboardVisibility,
} from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): AnalyticsDashboard {
  return AnalyticsDashboard.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      description: (data.description as string) ?? undefined,
      isDefault: data.isDefault as boolean,
      isSystem: data.isSystem as boolean,
      role: (data.role as string) ?? undefined,
      visibility: data.visibility as string,
      layout: (data.layout as Record<string, unknown>) ?? undefined,
      createdByUserId: data.createdByUserId as string,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaAnalyticsDashboardsRepository
  implements AnalyticsDashboardsRepository
{
  async create(
    data: CreateAnalyticsDashboardSchema,
  ): Promise<AnalyticsDashboard> {
    const dashboard = await prisma.analyticsDashboard.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        isDefault: data.isDefault ?? false,
        isSystem: data.isSystem ?? false,
        role: data.role as DashboardRole | undefined,
        visibility: (data.visibility as DashboardVisibility) ?? 'PRIVATE',
        layout: (data.layout ?? undefined) as unknown as
          | Prisma.InputJsonValue
          | undefined,
        createdByUserId: data.createdByUserId,
      },
    });

    return mapToDomain(dashboard as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<AnalyticsDashboard | null> {
    const dashboard = await prisma.analyticsDashboard.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    return dashboard
      ? mapToDomain(dashboard as unknown as Record<string, unknown>)
      : null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { role?: string; visibility?: string },
  ): Promise<AnalyticsDashboard[]> {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters?.role) where.role = filters.role;
    if (filters?.visibility) where.visibility = filters.visibility;

    const dashboards = await prisma.analyticsDashboard.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return dashboards.map((d) =>
      mapToDomain(d as unknown as Record<string, unknown>),
    );
  }

  async countMany(
    tenantId: string,
    filters?: { role?: string; visibility?: string },
  ): Promise<number> {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters?.role) where.role = filters.role;
    if (filters?.visibility) where.visibility = filters.visibility;

    return prisma.analyticsDashboard.count({ where });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.analyticsDashboard.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
