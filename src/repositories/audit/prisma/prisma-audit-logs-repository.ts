import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditLog } from '@/entities/audit/audit-log';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { Prisma, AuditLog as PrismaAuditLog } from '@prisma/client';
import {
  AuditLogsRepository,
  AuditLogStatistics,
  CreateAuditLogSchema,
  ListAuditLogsParams,
  ModuleStatistics,
  UserActivitySummary,
} from '../audit-logs-repository';

type PrismaAuditLogWithUser = PrismaAuditLog & {
  user?: {
    username: string | null;
    email: string;
    profile: {
      name: string;
      surname: string;
    } | null;
    permissionGroups: Array<{
      group: {
        id: string;
        name: string;
        slug: string;
      };
    }>;
  } | null;
};

export class PrismaAuditLogsRepository implements AuditLogsRepository {
  private readonly userSelect = {
    username: true,
    email: true,
    profile: {
      select: {
        name: true,
        surname: true,
      },
    },
    permissionGroups: {
      select: {
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    },
  } as const;

  private toDomain(raw: PrismaAuditLogWithUser): AuditLog {
    const profileName = raw.user?.profile
      ? `${raw.user.profile.name} ${raw.user.profile.surname}`.trim()
      : '';

    const userName =
      profileName || raw.user?.username || raw.user?.email || null;

    const userPermissionGroups =
      raw.user?.permissionGroups?.map((relation) => ({
        id: relation.group.id,
        name: relation.group.name,
        slug: relation.group.slug,
      })) ?? [];

    return AuditLog.create(
      {
        action: raw.action as AuditAction,
        entity: raw.entity as AuditEntity,
        module: raw.module as AuditModule,
        entityId: raw.entityId,
        description: raw.description,
        oldData: raw.oldData as Record<string, unknown> | null,
        newData: raw.newData as Record<string, unknown> | null,
        ip: raw.ip,
        userAgent: raw.userAgent,
        endpoint: raw.endpoint,
        method: raw.method,
        userId: raw.userId ? new UniqueEntityID(raw.userId) : null,
        affectedUser: raw.affectedUser,
        userName,
        userPermissionGroups,
        createdAt: raw.createdAt,
        expiresAt: raw.expiresAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  private buildWhereClause(
    params?: ListAuditLogsParams,
  ): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (params?.userId) {
      where.userId = params.userId.toString();
    }

    if (params?.affectedUser) {
      where.affectedUser = params.affectedUser;
    }

    if (params?.action) {
      where.action = params.action;
    }

    if (params?.entity) {
      where.entity = params.entity;
    }

    if (params?.module) {
      where.module = params.module;
    }

    if (params?.entityId) {
      where.entityId = params.entityId;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    return where;
  }

  async log(data: CreateAuditLogSchema): Promise<AuditLog> {
    const auditLog = await prisma.auditLog.create({
      data: {
        action: data.action,
        entity: data.entity,
        module: data.module,
        entityId: data.entityId,
        description: data.description ?? null,
        oldData: (data.oldData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newData: (data.newData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        endpoint: data.endpoint ?? null,
        method: data.method ?? null,
        userId: data.userId?.toString() ?? null,
        affectedUser: data.affectedUser ?? null,
        expiresAt: data.expiresAt ?? null,
      },
    });

    return this.toDomain(auditLog);
  }

  async logMany(data: CreateAuditLogSchema[]): Promise<void> {
    await prisma.auditLog.createMany({
      data: data.map((item) => ({
        action: item.action,
        entity: item.entity,
        module: item.module,
        entityId: item.entityId,
        description: item.description ?? null,
        oldData: (item.oldData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newData: (item.newData as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ip: item.ip ?? null,
        userAgent: item.userAgent ?? null,
        endpoint: item.endpoint ?? null,
        method: item.method ?? null,
        userId: item.userId?.toString() ?? null,
        affectedUser: item.affectedUser ?? null,
        expiresAt: item.expiresAt ?? null,
      })),
    });
  }

  async findById(id: UniqueEntityID): Promise<AuditLog | null> {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: id.toString() },
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });

    return auditLog ? this.toDomain(auditLog) : null;
  }

  async listAll(params?: ListAuditLogsParams): Promise<AuditLog[]> {
    const where = this.buildWhereClause(params);
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    const sortBy = params?.sortBy ?? 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });

    return auditLogs.map((log) => this.toDomain(log));
  }

  async listRecent(limit: number = 100): Promise<AuditLog[]> {
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: this.userSelect,
        },
      },
    });

    return auditLogs.map((log) => this.toDomain(log));
  }

  async listByUserId(
    userId: UniqueEntityID,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]> {
    return this.listAll({ ...params, userId });
  }

  async listByAffectedUser(
    userId: string,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]> {
    return this.listAll({ ...params, affectedUser: userId });
  }

  async listByModule(
    module: AuditModule,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]> {
    return this.listAll({ ...params, module });
  }

  async listByEntity(
    entity: AuditEntity,
    entityId: string,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]> {
    return this.listAll({ ...params, entity, entityId });
  }

  async listByAction(
    action: AuditAction,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]> {
    return this.listAll({ ...params, action });
  }

  async getStatistics(
    params?: ListAuditLogsParams,
  ): Promise<AuditLogStatistics> {
    const where = this.buildWhereClause(params);

    const [totalLogs, byAction, byEntity, byModule, uniqueUsers] =
      await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true },
        }),
        prisma.auditLog.groupBy({
          by: ['entity'],
          where,
          _count: { entity: true },
        }),
        prisma.auditLog.groupBy({
          by: ['module'],
          where,
          _count: { module: true },
        }),
        prisma.auditLog.findMany({
          where,
          select: { userId: true },
          distinct: ['userId'],
        }),
      ]);

    const uniqueEntities = await prisma.auditLog.findMany({
      where,
      select: { entityId: true },
      distinct: ['entityId'],
    });

    const actionStats: Record<AuditAction, number> = {} as Record<
      AuditAction,
      number
    >;
    byAction.forEach((item) => {
      actionStats[item.action as AuditAction] = item._count.action;
    });

    const entityStats: Record<AuditEntity, number> = {} as Record<
      AuditEntity,
      number
    >;
    byEntity.forEach((item) => {
      entityStats[item.entity as AuditEntity] = item._count.entity;
    });

    const moduleStats: Record<AuditModule, number> = {} as Record<
      AuditModule,
      number
    >;
    byModule.forEach((item) => {
      moduleStats[item.module as AuditModule] = item._count.module;
    });

    return {
      totalLogs,
      byAction: actionStats,
      byEntity: entityStats,
      byModule: moduleStats,
      uniqueUsers: uniqueUsers.filter((u) => u.userId !== null).length,
      uniqueEntities: uniqueEntities.length,
    };
  }

  async getModuleStatistics(
    module: AuditModule,
    params?: ListAuditLogsParams,
  ): Promise<ModuleStatistics> {
    const where = this.buildWhereClause({ ...params, module });

    const [count, byAction] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
    ]);

    const actionStats: Record<AuditAction, number> = {} as Record<
      AuditAction,
      number
    >;
    byAction.forEach((item) => {
      actionStats[item.action as AuditAction] = item._count.action;
    });

    return {
      module,
      count,
      byAction: actionStats,
    };
  }

  async getUserActivitySummary(
    userId: UniqueEntityID,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UserActivitySummary | null> {
    const where: Prisma.AuditLogWhereInput = {
      OR: [{ userId: userId.toString() }, { affectedUser: userId.toString() }],
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [performed, received, byAction, lastLog] = await Promise.all([
      prisma.auditLog.count({
        where: {
          userId: userId.toString(),
          ...(where.createdAt as Prisma.DateTimeFilter),
        },
      }),
      prisma.auditLog.count({
        where: {
          affectedUser: userId.toString(),
          ...(where.createdAt as Prisma.DateTimeFilter),
        },
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          userId: userId.toString(),
          ...(where.createdAt as Prisma.DateTimeFilter),
        },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 1,
      }),
      prisma.auditLog.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!lastLog) return null;

    return {
      userId: userId.toString(),
      actionsPerformed: performed,
      actionsReceived: received,
      mostCommonAction:
        (byAction[0]?.action as AuditAction) ?? AuditAction.OTHER,
      lastActivity: lastLog.createdAt,
    };
  }

  async getMostActiveUsers(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UserActivitySummary[]> {
    const where: Prisma.AuditLogWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const topUsers = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: limit,
    });

    const summaries = await Promise.all(
      topUsers
        .filter((u) => u.userId !== null)
        .map((u) =>
          this.getUserActivitySummary(
            new UniqueEntityID(u.userId!),
            startDate,
            endDate,
          ),
        ),
    );

    return summaries.filter((s) => s !== null) as UserActivitySummary[];
  }

  async getMostAuditedEntities(
    limit: number = 10,
  ): Promise<{ entity: AuditEntity; count: number }[]> {
    const result = await prisma.auditLog.groupBy({
      by: ['entity'],
      _count: { entity: true },
      orderBy: { _count: { entity: 'desc' } },
      take: limit,
    });

    return result.map((item) => ({
      entity: item.entity as AuditEntity,
      count: item._count.entity,
    }));
  }

  async getActionTrends(
    startDate: Date,
    endDate: Date,
    _interval: 'hour' | 'day' | 'week' | 'month',
  ): Promise<{ date: Date; action: AuditAction; count: number }[]> {
    // Implementation would require raw SQL for date truncation
    // Simplified version here
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        action: true,
      },
    });

    // Group by date and action (simplified)
    const trends = new Map<
      string,
      { date: Date; action: AuditAction; count: number }
    >();

    logs.forEach((log) => {
      const key = `${log.createdAt.toISOString()}-${log.action}`;
      const existing = trends.get(key);
      if (existing) {
        existing.count++;
      } else {
        trends.set(key, {
          date: log.createdAt,
          action: log.action as AuditAction,
          count: 1,
        });
      }
    });

    return Array.from(trends.values());
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });

    return result.count;
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  async deleteByEntity(entity: AuditEntity, entityId: string): Promise<number> {
    const result = await prisma.auditLog.deleteMany({
      where: {
        entity,
        entityId,
      },
    });

    return result.count;
  }

  async deleteAll(): Promise<void> {
    await prisma.auditLog.deleteMany();
  }

  async count(params?: ListAuditLogsParams): Promise<number> {
    const where = this.buildWhereClause(params);
    return prisma.auditLog.count({ where });
  }

  async exists(id: UniqueEntityID): Promise<boolean> {
    const count = await prisma.auditLog.count({
      where: { id: id.toString() },
    });

    return count > 0;
  }
}
