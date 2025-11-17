import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionAuditLog } from '@/entities/rbac/permission-audit-log';

export interface CreateAuditLogSchema {
  userId: UniqueEntityID;
  permissionCode: string;
  allowed: boolean;
  reason: string | null;
  resource: string | null;
  resourceId: string | null;
  action: string | null;
  ip: string | null;
  userAgent: string | null;
  endpoint: string | null;
}

export interface ListAuditLogsParams {
  userId?: UniqueEntityID;
  permissionCode?: string;
  allowed?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface AuditLogStats {
  totalChecks: number;
  allowed: number;
  denied: number;
  uniqueUsers: number;
  uniquePermissions: number;
}

export interface PermissionAuditLogsRepository {
  // CREATE
  log(data: CreateAuditLogSchema): Promise<PermissionAuditLog>;
  logMany(data: CreateAuditLogSchema[]): Promise<void>;

  // RETRIEVE
  findById(id: UniqueEntityID): Promise<PermissionAuditLog | null>;

  // LIST
  listAll(params?: ListAuditLogsParams): Promise<PermissionAuditLog[]>;
  listByUserId(
    userId: UniqueEntityID,
    params?: ListAuditLogsParams,
  ): Promise<PermissionAuditLog[]>;
  listByPermissionCode(
    permissionCode: string,
    params?: ListAuditLogsParams,
  ): Promise<PermissionAuditLog[]>;
  listDenied(params?: ListAuditLogsParams): Promise<PermissionAuditLog[]>;
  listRecent(limit?: number): Promise<PermissionAuditLog[]>;

  // STATISTICS
  getStats(params?: ListAuditLogsParams): Promise<AuditLogStats>;
  getMostCheckedPermissions(limit?: number): Promise<
    {
      permissionCode: string;
      count: number;
    }[]
  >;
  getMostDeniedPermissions(limit?: number): Promise<
    {
      permissionCode: string;
      count: number;
    }[]
  >;

  // CLEANUP
  deleteOlderThan(date: Date): Promise<number>; // Retorna quantidade deletada
  deleteAll(): Promise<void>;

  // UTILITY
  count(params?: ListAuditLogsParams): Promise<number>;
}
