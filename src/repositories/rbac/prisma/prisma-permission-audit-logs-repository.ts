import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionAuditLog } from '@/entities/rbac/permission-audit-log';
import { prisma } from '@/lib/prisma';
import type {
  AuditLogStats,
  CreateAuditLogSchema,
  ListAuditLogsParams,
  PermissionAuditLogsRepository,
} from '../permission-audit-logs-repository';

function truncate(value: string | undefined | null, maxLength: number): string | undefined | null {
  if (!value) return value;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export class PrismaPermissionAuditLogsRepository
  implements PermissionAuditLogsRepository
{
  // CREATE
  async log(data: CreateAuditLogSchema): Promise<PermissionAuditLog> {
    const auditLog = await prisma.permissionAuditLog.create({
      data: {
        userId: data.userId.toString(),
        permissionCode: truncate(data.permissionCode, 128)!,
        allowed: data.allowed,
        reason: truncate(data.reason, 512),
        resource: truncate(data.resource, 64),
        resourceId: data.resourceId,
        action: truncate(data.action, 64),
        ip: truncate(data.ip, 64),
        userAgent: truncate(data.userAgent, 512),
        endpoint: truncate(data.endpoint, 256),
      },
    });

    return PermissionAuditLog.create(
      {
        id: new UniqueEntityID(auditLog.id),
        userId: new UniqueEntityID(auditLog.userId),
        permissionCode: auditLog.permissionCode,
        allowed: auditLog.allowed,
        reason: auditLog.reason,
        resource: auditLog.resource,
        resourceId: auditLog.resourceId,
        action: auditLog.action,
        ip: auditLog.ip,
        userAgent: auditLog.userAgent,
        endpoint: auditLog.endpoint,
        createdAt: auditLog.createdAt,
      },
      new UniqueEntityID(auditLog.id),
    );
  }

  // RETRIEVE
  async findById(id: UniqueEntityID): Promise<PermissionAuditLog | null> {
    const log = await prisma.permissionAuditLog.findUnique({
      where: { id: id.toString() },
    });

    if (!log) return null;

    return PermissionAuditLog.create(
      {
        id: new UniqueEntityID(log.id),
        userId: new UniqueEntityID(log.userId),
        permissionCode: log.permissionCode,
        allowed: log.allowed,
        reason: log.reason,
        resource: log.resource,
        resourceId: log.resourceId,
        action: log.action,
        ip: log.ip,
        userAgent: log.userAgent,
        endpoint: log.endpoint,
        createdAt: log.createdAt,
      },
      new UniqueEntityID(log.id),
    );
  }

  async logMany(data: CreateAuditLogSchema[]): Promise<void> {
    await prisma.permissionAuditLog.createMany({
      data: data.map((d) => ({
        userId: d.userId.toString(),
        permissionCode: truncate(d.permissionCode, 128)!,
        allowed: d.allowed,
        reason: truncate(d.reason, 512),
        resource: truncate(d.resource, 64),
        resourceId: d.resourceId,
        action: truncate(d.action, 64),
        ip: truncate(d.ip, 64),
        userAgent: truncate(d.userAgent, 512),
        endpoint: truncate(d.endpoint, 256),
      })),
    });
  }

  // LIST
  async listAll(params?: ListAuditLogsParams): Promise<PermissionAuditLog[]> {
    const {
      userId,
      permissionCode,
      allowed,
      startDate,
      endDate,
      page = 1,
      limit = 100,
    } = params || {};

    const offset = (page - 1) * limit;

    const logs = await prisma.permissionAuditLog.findMany({
      where: {
        ...(userId && { userId: userId.toString() }),
        ...(permissionCode && { permissionCode }),
        ...(allowed !== undefined && { allowed }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return logs.map((log) =>
      PermissionAuditLog.create(
        {
          id: new UniqueEntityID(log.id),
          userId: new UniqueEntityID(log.userId),
          permissionCode: log.permissionCode,
          allowed: log.allowed,
          reason: log.reason,
          resource: log.resource,
          resourceId: log.resourceId,
          action: log.action,
          ip: log.ip,
          userAgent: log.userAgent,
          endpoint: log.endpoint,
          createdAt: log.createdAt,
        },
        new UniqueEntityID(log.id),
      ),
    );
  }

  async listByUserId(
    userId: UniqueEntityID,
    params?: ListAuditLogsParams,
  ): Promise<PermissionAuditLog[]> {
    return this.listAll({ ...params, userId });
  }

  async listByPermissionCode(
    permissionCode: string,
    params?: ListAuditLogsParams,
  ): Promise<PermissionAuditLog[]> {
    return this.listAll({ ...params, permissionCode });
  }

  async listDenied(
    params?: ListAuditLogsParams,
  ): Promise<PermissionAuditLog[]> {
    return this.listAll({ ...params, allowed: false });
  }

  async listRecent(limit = 100): Promise<PermissionAuditLog[]> {
    const logs = await prisma.permissionAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map((log) =>
      PermissionAuditLog.create(
        {
          id: new UniqueEntityID(log.id),
          userId: new UniqueEntityID(log.userId),
          permissionCode: log.permissionCode,
          allowed: log.allowed,
          reason: log.reason,
          resource: log.resource,
          resourceId: log.resourceId,
          action: log.action,
          ip: log.ip,
          userAgent: log.userAgent,
          endpoint: log.endpoint,
          createdAt: log.createdAt,
        },
        new UniqueEntityID(log.id),
      ),
    );
  }

  // STATISTICS
  async getStats(params?: ListAuditLogsParams): Promise<AuditLogStats> {
    const { userId, permissionCode, startDate, endDate } = params || {};

    const where = {
      ...(userId && { userId: userId.toString() }),
      ...(permissionCode && { permissionCode }),
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const [totalChecks, allowed, denied, uniqueUsers, uniquePermissions] =
      await Promise.all([
        prisma.permissionAuditLog.count({ where }),
        prisma.permissionAuditLog.count({ where: { ...where, allowed: true } }),
        prisma.permissionAuditLog.count({
          where: { ...where, allowed: false },
        }),
        prisma.permissionAuditLog
          .findMany({
            where,
            select: { userId: true },
            distinct: ['userId'],
          })
          .then((results) => results.length),
        prisma.permissionAuditLog
          .findMany({
            where,
            select: { permissionCode: true },
            distinct: ['permissionCode'],
          })
          .then((results) => results.length),
      ]);

    return {
      totalChecks,
      allowed,
      denied,
      uniqueUsers,
      uniquePermissions,
    };
  }

  async getMostCheckedPermissions(
    limit = 10,
  ): Promise<{ permissionCode: string; count: number }[]> {
    const result = await prisma.permissionAuditLog.groupBy({
      by: ['permissionCode'],
      _count: { permissionCode: true },
      orderBy: {
        _count: { permissionCode: 'desc' },
      },
      take: limit,
    });

    return result.map((r) => ({
      permissionCode: r.permissionCode,
      count: r._count.permissionCode,
    }));
  }

  async getMostDeniedPermissions(
    limit = 10,
  ): Promise<{ permissionCode: string; count: number }[]> {
    const result = await prisma.permissionAuditLog.groupBy({
      by: ['permissionCode'],
      where: { allowed: false },
      _count: { permissionCode: true },
      orderBy: {
        _count: { permissionCode: 'desc' },
      },
      take: limit,
    });

    return result.map((r) => ({
      permissionCode: r.permissionCode,
      count: r._count.permissionCode,
    }));
  }

  // CLEANUP
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.permissionAuditLog.deleteMany({
      where: {
        createdAt: { lt: date },
      },
    });

    return result.count;
  }

  async deleteAll(): Promise<void> {
    await prisma.permissionAuditLog.deleteMany();
  }

  // UTILITY
  async count(params?: ListAuditLogsParams): Promise<number> {
    const { userId, permissionCode, allowed, startDate, endDate } =
      params || {};

    return await prisma.permissionAuditLog.count({
      where: {
        ...(userId && { userId: userId.toString() }),
        ...(permissionCode && { permissionCode }),
        ...(allowed !== undefined && { allowed }),
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
    });
  }
}
