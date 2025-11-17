import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { ListUserPermissionsUseCase } from '../list-user-permissions';

export function makeListUserPermissionsUseCase() {
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const usersRepository = new PrismaUsersRepository();

  return new ListUserPermissionsUseCase(
    userPermissionGroupsRepository,
    usersRepository,
  );
}
