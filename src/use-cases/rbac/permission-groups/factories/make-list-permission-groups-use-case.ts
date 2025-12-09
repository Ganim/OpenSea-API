import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { ListPermissionGroupsUseCase } from '../list-permission-groups';

export function makeListPermissionGroupsUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();
  const usersRepository = new PrismaUsersRepository();
  const permissionsRepository = new PrismaPermissionsRepository();

  return new ListPermissionGroupsUseCase(
    permissionGroupsRepository,
    userPermissionGroupsRepository,
    permissionGroupPermissionsRepository,
    usersRepository,
    permissionsRepository,
  );
}
