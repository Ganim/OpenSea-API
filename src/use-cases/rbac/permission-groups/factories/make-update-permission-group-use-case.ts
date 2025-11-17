import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { UpdatePermissionGroupUseCase } from '../update-permission-group';

export function makeUpdatePermissionGroupUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  return new UpdatePermissionGroupUseCase(permissionGroupsRepository);
}
