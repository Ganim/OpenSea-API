import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { GetPermissionGroupByIdUseCase } from '../get-permission-group-by-id';

export function makeGetPermissionGroupByIdUseCase() {
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  return new GetPermissionGroupByIdUseCase(permissionGroupsRepository);
}
