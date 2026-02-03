import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AuditLog } from '@/entities/audit/audit-log';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';

export interface CreateAuditLogSchema {
  action: AuditAction;
  entity: AuditEntity;
  module: AuditModule;
  entityId: string;
  description?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;

  // Request metadata
  ip?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  method?: string | null;

  // Multi-Tenant (nullable for system actions)
  tenantId?: UniqueEntityID | null;

  // User info
  userId?: UniqueEntityID | null;
  affectedUser?: string | null;

  expiresAt?: Date | null;
}

export interface ListAuditLogsParams {
  // Filters
  tenantId?: UniqueEntityID;
  userId?: UniqueEntityID;
  affectedUser?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  module?: AuditModule;
  entityId?: string;

  // Date range
  startDate?: Date;
  endDate?: Date;

  // Pagination
  page?: number;
  limit?: number;

  // Sorting
  sortBy?: 'createdAt' | 'action' | 'entity' | 'module';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogStatistics {
  totalLogs: number;
  byAction: Record<AuditAction, number>;
  byEntity: Record<AuditEntity, number>;
  byModule: Record<AuditModule, number>;
  uniqueUsers: number;
  uniqueEntities: number;
}

export interface ModuleStatistics {
  module: AuditModule;
  count: number;
  byAction: Record<AuditAction, number>;
}

export interface UserActivitySummary {
  userId: string;
  actionsPerformed: number;
  actionsReceived: number;
  mostCommonAction: AuditAction;
  lastActivity: Date;
}

export interface AuditLogsRepository {
  // CREATE
  log(data: CreateAuditLogSchema): Promise<AuditLog>;
  logMany(data: CreateAuditLogSchema[]): Promise<void>;

  // RETRIEVE
  findById(id: UniqueEntityID): Promise<AuditLog | null>;

  // LIST - General
  listAll(params?: ListAuditLogsParams): Promise<AuditLog[]>;
  listRecent(limit?: number): Promise<AuditLog[]>;

  // LIST - By User
  listByUserId(
    userId: UniqueEntityID,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]>;

  // LIST - By Affected User (ações que afetaram um usuário)
  listByAffectedUser(
    userId: string,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]>;

  // LIST - By Module
  listByModule(
    module: AuditModule,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]>;

  // LIST - By Entity
  listByEntity(
    entity: AuditEntity,
    entityId: string,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]>;

  // LIST - By Action
  listByAction(
    action: AuditAction,
    params?: ListAuditLogsParams,
  ): Promise<AuditLog[]>;

  // STATISTICS
  getStatistics(params?: ListAuditLogsParams): Promise<AuditLogStatistics>;

  getModuleStatistics(
    module: AuditModule,
    params?: ListAuditLogsParams,
  ): Promise<ModuleStatistics>;

  getUserActivitySummary(
    userId: UniqueEntityID,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UserActivitySummary | null>;

  getMostActiveUsers(
    limit?: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UserActivitySummary[]>;

  // ANALYTICS
  getMostAuditedEntities(limit?: number): Promise<
    {
      entity: AuditEntity;
      count: number;
    }[]
  >;

  getActionTrends(
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' | 'month',
  ): Promise<
    {
      date: Date;
      action: AuditAction;
      count: number;
    }[]
  >;

  // CLEANUP
  deleteOlderThan(date: Date): Promise<number>;
  deleteExpired(): Promise<number>;
  deleteByEntity(entity: AuditEntity, entityId: string): Promise<number>;
  deleteAll(): Promise<void>;

  // UTILITY
  count(params?: ListAuditLogsParams): Promise<number>;
  exists(id: UniqueEntityID): Promise<boolean>;
}
