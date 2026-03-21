import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Activity } from '@/entities/sales/activity';
import { prisma } from '@/lib/prisma';
import { activityPrismaToDomain } from '@/mappers/sales/activity/activity-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  ActivitiesRepository,
  FindManyActivitiesPaginatedParams,
} from '../activities-repository';
// TODO: CrmActivity model not yet in Prisma schema — using `any` casts until migration is added
type PrismaActivityType = string;
type PrismaActivityStatus = string;

export class PrismaActivitiesRepository implements ActivitiesRepository {
  async create(activity: Activity): Promise<void> {
    await (prisma as any).crmActivity.create({
      data: {
        id: activity.id.toString(),
        tenantId: activity.tenantId.toString(),
        dealId: activity.dealId?.toString() ?? null,
        contactId: activity.contactId?.toString() ?? null,
        type: activity.type as PrismaActivityType,
        title: activity.title,
        description: activity.description ?? null,
        status: activity.status as PrismaActivityStatus,
        dueDate: activity.dueDate ?? null,
        completedAt: activity.completedAt ?? null,
        duration: activity.duration ?? null,
        userId: activity.userId.toString(),
        createdAt: activity.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Activity | null> {
    const data = await (prisma as any).crmActivity.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return activityPrismaToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyPaginated(
    params: FindManyActivitiesPaginatedParams,
  ): Promise<PaginatedResult<Activity>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.dealId) {
      where.dealId = params.dealId;
    }
    if (params.contactId) {
      where.contactId = params.contactId;
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.search) {
      where.title = { contains: params.search, mode: 'insensitive' };
    }

    const [activitiesData, total] = await Promise.all([
      (prisma as any).crmActivity.findMany({
        where: where as never,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
      }),
      (prisma as any).crmActivity.count({
        where: where as never,
      }),
    ]);

    return {
      data: activitiesData.map((a: any) =>
        activityPrismaToDomain(a as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByDeal(
    dealId: string,
    tenantId: string,
  ): Promise<Activity[]> {
    const items = await (prisma as any).crmActivity.findMany({
      where: {
        dealId,
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((a: any) =>
      activityPrismaToDomain(a as unknown as Record<string, unknown>),
    );
  }

  async save(activity: Activity): Promise<void> {
    await (prisma as any).crmActivity.update({
      where: { id: activity.id.toString() },
      data: {
        title: activity.title,
        description: activity.description ?? null,
        status: activity.status as PrismaActivityStatus,
        dueDate: activity.dueDate ?? null,
        completedAt: activity.completedAt ?? null,
        duration: activity.duration ?? null,
        deletedAt: activity.deletedAt ?? null,
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await (prisma as any).crmActivity.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
