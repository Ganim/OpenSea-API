import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { AssignGroupToUserUseCase } from '../assign-group-to-user';

export function makeAssignGroupToUserUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();

  return new AssignGroupToUserUseCase(
    usersRepository,
    permissionGroupsRepository,
    userPermissionGroupsRepository,
  );
}
