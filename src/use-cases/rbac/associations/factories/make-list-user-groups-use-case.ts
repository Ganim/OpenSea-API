import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { ListUserGroupsUseCase } from '../list-user-groups';

export function makeListUserGroupsUseCase() {
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const usersRepository = new PrismaUsersRepository();

  return new ListUserGroupsUseCase(
    userPermissionGroupsRepository,
    usersRepository,
  );
}
