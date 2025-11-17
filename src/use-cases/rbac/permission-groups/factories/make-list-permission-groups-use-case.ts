import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { ListPermissionGroupsUseCase } from '../list-permission-groups';

export function makeListPermissionGroupsUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  return new ListPermissionGroupsUseCase(permissionGroupsRepository);
}
