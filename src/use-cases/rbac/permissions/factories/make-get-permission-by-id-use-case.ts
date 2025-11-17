import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { GetPermissionByIdUseCase } from '../get-permission-by-id';

export function makeGetPermissionByIdUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  return new GetPermissionByIdUseCase(permissionsRepository);
}
