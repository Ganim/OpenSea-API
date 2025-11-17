import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { CreatePermissionUseCase } from '../create-permission';

export function makeCreatePermissionUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  return new CreatePermissionUseCase(permissionsRepository);
}
