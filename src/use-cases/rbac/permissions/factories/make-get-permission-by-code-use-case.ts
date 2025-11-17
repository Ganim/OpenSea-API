import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { GetPermissionByCodeUseCase } from '../get-permission-by-code';

export function makeGetPermissionByCodeUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  return new GetPermissionByCodeUseCase(permissionsRepository);
}
