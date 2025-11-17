import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { DeletePermissionUseCase } from '../delete-permission';

export function makeDeletePermissionUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();

  return new DeletePermissionUseCase(
    permissionsRepository,
    permissionGroupPermissionsRepository,
  );
}
