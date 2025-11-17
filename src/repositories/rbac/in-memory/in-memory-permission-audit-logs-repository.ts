import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionAuditLog } from '@/entities/rbac/permission-audit-log';
import type {
    AuditLogStats,
    CreateAuditLogSchema,
    ListAuditLogsParams,
    PermissionAuditLogsRepository,
} from '../permission-audit-logs-repository';

export class InMemoryPermissionAuditLogsRepository
  implements PermissionAuditLogsRepository
{
  public items: PermissionAuditLog[] = [];

  async log(data: CreateAuditLogSchema): Promise<PermissionAuditLog> {
    const auditLog = PermissionAuditLog.create({
      id: new UniqueEntityID(),
      userId: data.userId,
      permissionCode: data.permissionCode,
      allowed: data.allowed,
      reason: data.reason,
      resource: data.resource,
      resourceId: data.resourceId,
      action: data.action,
      ip: data.ip,
      userAgent: data.userAgent,
      endpoint: data.endpoint,
    });

    this.items.push(auditLog);
    return auditLog;
  }

  async logMany(data: CreateAuditLogSchema[]): Promise<void> {
    const logs = data.map((item) =>
      PermissionAuditLog.create({
        id: new UniqueEntityID(),
        userId: item.userId,
        permissionCode: item.permissionCode,
        allowed: item.allowed,
        reason: item.reason,
        resource: item.resource,
        resourceId: item.resourceId,
        action: item.action,
        ip: item.ip,
        userAgent: item.userAgent,
        endpoint: item.endpoint,
      }),
    );

    this.items.push(...logs);
  }

  async findById(id: UniqueEntityID): Promise<PermissionAuditLog | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

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

    let filtered = this.items;

    if (userId) {
      filtered = filtered.filter((item) => item.userId.equals(userId));
    }

    if (permissionCode) {
      filtered = filtered.filter(
        (item) => item.permissionCode === permissionCode,
      );
    }

    if (allowed !== undefined) {
      filtered = filtered.filter((item) => item.allowed === allowed);
    }

    if (startDate) {
      filtered = filtered.filter((item) => item.createdAt >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((item) => item.createdAt <= endDate);
    }

    // Ordenar por data decrescente (mais recentes primeiro)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
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
    return this.items
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getStats(params?: ListAuditLogsParams): Promise<AuditLogStats> {
    const filtered = await this.listAll(params);

    const allowed = filtered.filter((item) => item.allowed).length;
    const denied = filtered.filter((item) => !item.allowed).length;

    const uniqueUserIds = new Set(
      filtered.map((item) => item.userId.toString()),
    );
    const uniquePermissions = new Set(
      filtered.map((item) => item.permissionCode),
    );

    return {
      totalChecks: filtered.length,
      allowed,
      denied,
      uniqueUsers: uniqueUserIds.size,
      uniquePermissions: uniquePermissions.size,
    };
  }

  async getMostCheckedPermissions(
    limit = 10,
  ): Promise<{ permissionCode: string; count: number }[]> {
    const counts = new Map<string, number>();

    for (const item of this.items) {
      const current = counts.get(item.permissionCode) || 0;
      counts.set(item.permissionCode, current + 1);
    }

    return Array.from(counts.entries())
      .map(([permissionCode, count]) => ({ permissionCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getMostDeniedPermissions(
    limit = 10,
  ): Promise<{ permissionCode: string; count: number }[]> {
    const counts = new Map<string, number>();

    for (const item of this.items.filter((i) => !i.allowed)) {
      const current = counts.get(item.permissionCode) || 0;
      counts.set(item.permissionCode, current + 1);
    }

    return Array.from(counts.entries())
      .map(([permissionCode, count]) => ({ permissionCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const beforeCount = this.items.length;

    this.items = this.items.filter((item) => item.createdAt >= date);

    return beforeCount - this.items.length;
  }

  async deleteAll(): Promise<void> {
    this.items = [];
  }

  async count(params?: ListAuditLogsParams): Promise<number> {
    const filtered = await this.listAll(params);
    return filtered.length;
  }
}
