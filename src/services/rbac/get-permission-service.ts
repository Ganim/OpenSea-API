import { PrismaPermissionAuditLogsRepository } from '@/repositories/rbac/prisma/prisma-permission-audit-logs-repository';
import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { PermissionService } from './permission-service';

/**
 * Shared singleton PermissionService instance.
 * All code that needs PermissionService should use this getter
 * so that cache invalidation works across the entire process.
 */
let _instance: PermissionService | null = null;

export function getPermissionService(): PermissionService {
  if (!_instance) {
    _instance = new PermissionService(
      new PrismaPermissionsRepository(),
      new PrismaPermissionGroupsRepository(),
      new PrismaPermissionGroupPermissionsRepository(),
      new PrismaUserPermissionGroupsRepository(),
      new PrismaPermissionAuditLogsRepository(),
    );
  }
  return _instance;
}
