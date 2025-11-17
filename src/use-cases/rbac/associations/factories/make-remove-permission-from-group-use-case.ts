import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { RemovePermissionFromGroupUseCase } from '../remove-permission-from-group';

export function makeRemovePermissionFromGroupUseCase() {
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();
  const permissionsRepository = new PrismaPermissionsRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();

  return new RemovePermissionFromGroupUseCase(
    permissionGroupPermissionsRepository,
    permissionsRepository,
    permissionGroupsRepository,
  );
}
