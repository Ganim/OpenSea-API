import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { ListUsersByGroupUseCase } from '../list-users-by-group';

export function makeListUsersByGroupUseCase() {
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();

  return new ListUsersByGroupUseCase(
    userPermissionGroupsRepository,
    permissionGroupsRepository,
  );
}
