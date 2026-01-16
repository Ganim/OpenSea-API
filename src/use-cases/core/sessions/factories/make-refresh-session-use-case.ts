import { PrismaRefreshTokensRepository } from '@/repositories/core/prisma/prisma-refresh-tokens-repository';
import { PrismaSessionsRepository } from '@/repositories/core/prisma/prisma-sessions-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaPermissionAuditLogsRepository } from '@/repositories/rbac/prisma/prisma-permission-audit-logs-repository';
import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { PermissionService } from '@/services/rbac/permission-service';
import { RefreshSessionUseCase } from '../refresh-session';

export function makeRefreshSessionUseCase() {
  const sessionsRepository = new PrismaSessionsRepository();
  const usersRepository = new PrismaUsersRepository();
  const refreshTokensRepository = new PrismaRefreshTokensRepository();

  // Initialize permission service
  const permissionsRepository = new PrismaPermissionsRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const permissionAuditLogsRepository =
    new PrismaPermissionAuditLogsRepository();

  const permissionService = new PermissionService(
    permissionsRepository,
    permissionGroupsRepository,
    permissionGroupPermissionsRepository,
    userPermissionGroupsRepository,
    permissionAuditLogsRepository,
  );

  return new RefreshSessionUseCase(
    sessionsRepository,
    usersRepository,
    refreshTokensRepository,
    permissionService,
  );
}


