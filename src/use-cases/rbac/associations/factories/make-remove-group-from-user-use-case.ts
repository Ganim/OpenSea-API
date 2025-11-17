import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { RemoveGroupFromUserUseCase } from '../remove-group-from-user';

export function makeRemoveGroupFromUserUseCase() {
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const usersRepository = new PrismaUsersRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();

  return new RemoveGroupFromUserUseCase(
    userPermissionGroupsRepository,
    usersRepository,
    permissionGroupsRepository,
  );
}
