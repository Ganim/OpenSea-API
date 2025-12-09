import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserDirectPermissionsRepository } from '@/repositories/rbac/prisma/prisma-user-direct-permissions-repository';
import { ListUsersByPermissionUseCase } from '../list-users-by-permission';

export function makeListUsersByPermissionUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  const userDirectPermissionsRepository =
    new PrismaUserDirectPermissionsRepository();

  return new ListUsersByPermissionUseCase(
    permissionsRepository,
    userDirectPermissionsRepository,
  );
}
