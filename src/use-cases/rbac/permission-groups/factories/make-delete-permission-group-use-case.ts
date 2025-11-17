import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { DeletePermissionGroupUseCase } from '../delete-permission-group';

export function makeDeletePermissionGroupUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();

  return new DeletePermissionGroupUseCase(
    permissionGroupsRepository,
    userPermissionGroupsRepository,
  );
}
