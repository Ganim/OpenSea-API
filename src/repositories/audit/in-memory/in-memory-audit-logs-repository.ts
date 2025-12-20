import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AuditLog } from '@/entities/audit/audit-log';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import {
  AuditLogsRepository,
  CreateAuditLogSchema,
  ListAuditLogsParams,
  AuditLogStatistics,
  ModuleStatistics,
  UserActivitySummary,
} from '../audit-logs-repository';

export class InMemoryAuditLogsRepository implements AuditLogsRepository {
  public items: AuditLog[] = [];

  async log(data: CreateAuditLogSchema): Promise<AuditLog> {
    const auditLog = AuditLog.create({
      action: data.action,
      entity: data.entity,
      module: data.module,
      entityId: data.entityId,
      description: data.description ?? null,
      oldData: data.oldData ?? null,
      newData: data.newData ?? null,
      ip: data.ip ?? null,
      userAgent: data.userAgent ?? null,
      endpoint: data.endpoint ?? null,
      method: data.method ?? null,
      userId: data.userId ?? null,
      affectedUser: data.affectedUser ?? null,
      expiresAt: data.expiresAt ?? null,
    });

    this.items.push(auditLog);

    return auditLog;
  }

  async logMany(data: CreateAuditLogSchema[]): Promise<void> {
    for (const item of data) {
      await this.log(item);
    }
  }

  async findById(id: UniqueEntityID): Promise<AuditLog | null> {
    const log = this.items.find(item => item.id.equals(id));
    return log || null;
  }

  async listAll(params?: ListAuditLogsParams): Promise<AuditLog[]> {
    let filtered = [...this.items];

    // Apply filters
    if (params?.userId) {
      filtered = filtered.filter(log => log.userId === params.userId);
    }

    if (params?.affectedUser) {
      filtered = filtered.filter(log => log.affectedUser === params.affectedUser);
    }

    if (params?.action) {
      filtered = filtered.filter(log => log.action === params.action);
    }

    if (params?.entity) {
      filtered = filtered.filter(log => log.entity === params.entity);
    }

    if (params?.module) {
      filtered = filtered.filter(log => log.module === params.module);
    }

    if (params?.entityId) {
      filtered = filtered.filter(log => log.entityId === params.entityId);
    }

    if (params?.startDate) {
      filtered = filtered.filter(log => log.createdAt >= params.startDate!);
    }

    if (params?.endDate) {
      filtered = filtered.filter(log => log.createdAt <= params.endDate!);
    }

    // Sort
    const sortBy = params?.sortBy ?? 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'createdAt') {
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
      } else if (sortBy === 'action') {
        aValue = a.action;
        bValue = b.action;
      } else if (sortBy === 'entity') {
        aValue = a.entity;
        bValue = b.entity;
      } else if (sortBy === 'module') {
        aValue = a.module;
        bValue = b.module;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Pagination
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const skip = (page - 1) * limit;

    return filtered.slice(skip, skip + limit);
  }

  async listRecent(limit: number = 100): Promise<AuditLog[]> {
    return this.listAll({ limit, sortBy: 'createdAt', sortOrder: 'desc' });
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

  async getStatistics(params?: ListAuditLogsParams): Promise<AuditLogStatistics> {
    const logs = await this.listAll(params);

    const byAction: Record<AuditAction, number> = {} as any;
    const byEntity: Record<AuditEntity, number> = {} as any;
    const byModule: Record<AuditModule, number> = {} as any;
    const uniqueUserIds = new Set<string>();
    const uniqueEntityIds = new Set<string>();

    for (const log of logs) {
      // Count by action
      byAction[log.action] = (byAction[log.action] || 0) + 1;

      // Count by entity
      byEntity[log.entity] = (byEntity[log.entity] || 0) + 1;

      // Count by module
      byModule[log.module] = (byModule[log.module] || 0) + 1;

      // Track unique users
      if (log.userId) {
        uniqueUserIds.add(log.userId.toString());
      }

      // Track unique entities
      uniqueEntityIds.add(log.entityId);
    }

    return {
      totalLogs: logs.length,
      byAction,
      byEntity,
      byModule,
      uniqueUsers: uniqueUserIds.size,
      uniqueEntities: uniqueEntityIds.size,
    };
  }

  async getModuleStatistics(
    module: AuditModule,
    params?: ListAuditLogsParams,
  ): Promise<ModuleStatistics> {
    const logs = await this.listByModule(module, params);

    const byAction: Record<AuditAction, number> = {} as any;

    for (const log of logs) {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
    }

    return {
      module,
      count: logs.length,
      byAction,
    };
  }

  async getUserActivitySummary(
    userId: UniqueEntityID,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UserActivitySummary | null> {
    const performed = await this.listByUserId(userId, { startDate, endDate });
    const received = await this.listByAffectedUser(userId.toString(), {
      startDate,
      endDate,
    });

    if (performed.length === 0 && received.length === 0) {
      return null;
    }

    // Count actions
    const actionCounts: Record<AuditAction, number> = {} as any;
    for (const log of performed) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    }

    // Find most common action
    let mostCommonAction = AuditAction.OTHER;
    let maxCount = 0;
    for (const [action, count] of Object.entries(actionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonAction = action as AuditAction;
      }
    }

    // Find last activity
    const allLogs = [...performed, ...received];
    allLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const lastActivity = allLogs[0]?.createdAt || new Date();

    return {
      userId: userId.toString(),
      actionsPerformed: performed.length,
      actionsReceived: received.length,
      mostCommonAction,
      lastActivity,
    };
  }

  async getMostActiveUsers(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UserActivitySummary[]> {
    const logs = await this.listAll({ startDate, endDate });

    // Group by userId
    const userActivities = new Map<string, { performed: number; received: number }>();

    for (const log of logs) {
      if (log.userId) {
        const userId = log.userId.toString();
        const activity = userActivities.get(userId) || { performed: 0, received: 0 };
        activity.performed++;
        userActivities.set(userId, activity);
      }

      if (log.affectedUser) {
        const activity = userActivities.get(log.affectedUser) || {
          performed: 0,
          received: 0,
        };
        activity.received++;
        userActivities.set(log.affectedUser, activity);
      }
    }

    // Sort by total activity
    const sorted = Array.from(userActivities.entries())
      .map(([userId, activity]) => ({
        userId,
        total: activity.performed + activity.received,
        ...activity,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    // Get full summaries
    const summaries: UserActivitySummary[] = [];
    for (const user of sorted) {
      const summary = await this.getUserActivitySummary(
        new UniqueEntityID(user.userId),
        startDate,
        endDate,
      );
      if (summary) {
        summaries.push(summary);
      }
    }

    return summaries;
  }

  async getMostAuditedEntities(
    limit: number = 10,
  ): Promise<{ entity: AuditEntity; count: number }[]> {
    const entityCounts = new Map<AuditEntity, number>();

    for (const log of this.items) {
      const count = entityCounts.get(log.entity) || 0;
      entityCounts.set(log.entity, count + 1);
    }

    return Array.from(entityCounts.entries())
      .map(([entity, count]) => ({ entity, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getActionTrends(
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' | 'month',
  ): Promise<{ date: Date; action: AuditAction; count: number }[]> {
    const logs = await this.listAll({ startDate, endDate });

    // Simple grouping by date and action
    const trends = new Map<string, { date: Date; action: AuditAction; count: number }>();

    for (const log of logs) {
      const key = `${log.createdAt.toISOString()}-${log.action}`;
      const existing = trends.get(key);

      if (existing) {
        existing.count++;
      } else {
        trends.set(key, {
          date: log.createdAt,
          action: log.action,
          count: 1,
        });
      }
    }

    return Array.from(trends.values());
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const before = this.items.length;
    this.items = this.items.filter(log => log.createdAt >= date);
    return before - this.items.length;
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const before = this.items.length;
    this.items = this.items.filter(log => !log.expiresAt || log.expiresAt > now);
    return before - this.items.length;
  }

  async deleteByEntity(entity: AuditEntity, entityId: string): Promise<number> {
    const before = this.items.length;
    this.items = this.items.filter(
      log => !(log.entity === entity && log.entityId === entityId),
    );
    return before - this.items.length;
  }

  async deleteAll(): Promise<void> {
    this.items = [];
  }

  async count(params?: ListAuditLogsParams): Promise<number> {
    const logs = await this.listAll(params);
    return logs.length;
  }

  async exists(id: UniqueEntityID): Promise<boolean> {
    return this.items.some(log => log.id.equals(id));
  }
}
