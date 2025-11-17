import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { CreatePermissionGroupUseCase } from '../create-permission-group';

export function makeCreatePermissionGroupUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  return new CreatePermissionGroupUseCase(permissionGroupsRepository);
}
