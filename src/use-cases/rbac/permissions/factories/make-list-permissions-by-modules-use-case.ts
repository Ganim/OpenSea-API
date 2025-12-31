import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { ListPermissionsByModulesUseCase } from '../list-permissions-by-modules';

export function makeListPermissionsByModulesUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  return new ListPermissionsByModulesUseCase(permissionsRepository);
}
