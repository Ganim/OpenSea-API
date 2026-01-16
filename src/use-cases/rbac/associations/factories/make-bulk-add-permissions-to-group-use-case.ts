import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { BulkAddPermissionsToGroupUseCase } from '../bulk-add-permissions-to-group';

export function makeBulkAddPermissionsToGroupUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const permissionsRepository = new PrismaPermissionsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();

  return new BulkAddPermissionsToGroupUseCase(
    permissionGroupsRepository,
    permissionsRepository,
    permissionGroupPermissionsRepository,
  );
}
