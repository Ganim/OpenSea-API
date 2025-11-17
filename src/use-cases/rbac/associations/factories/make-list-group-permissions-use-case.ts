import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { ListGroupPermissionsUseCase } from '../list-group-permissions';

export function makeListGroupPermissionsUseCase() {
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();

  return new ListGroupPermissionsUseCase(
    permissionGroupPermissionsRepository,
    permissionGroupsRepository,
  );
}
