import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { AddPermissionToGroupUseCase } from '../add-permission-to-group';

export function makeAddPermissionToGroupUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const permissionsRepository = new PrismaPermissionsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();

  return new AddPermissionToGroupUseCase(
    permissionGroupsRepository,
    permissionsRepository,
    permissionGroupPermissionsRepository,
  );
}
