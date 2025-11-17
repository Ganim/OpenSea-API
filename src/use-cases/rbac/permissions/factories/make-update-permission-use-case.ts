import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { UpdatePermissionUseCase } from '../update-permission';

export function makeUpdatePermissionUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  return new UpdatePermissionUseCase(permissionsRepository);
}
