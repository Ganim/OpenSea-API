import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { GetPermissionGroupByIdUseCase } from '../get-permission-group-by-id';

export function makeGetPermissionGroupByIdUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();
  const usersRepository = new PrismaUsersRepository();

  return new GetPermissionGroupByIdUseCase(
    permissionGroupsRepository,
    userPermissionGroupsRepository,
    permissionGroupPermissionsRepository,
    usersRepository,
  );
}
