import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserDirectPermissionsRepository } from '@/repositories/rbac/prisma/prisma-user-direct-permissions-repository';
import { ListUsersByPermissionUseCase } from '../list-users-by-permission';

export function makeListUsersByPermissionUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  const userDirectPermissionsRepository =
    new PrismaUserDirectPermissionsRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();

  return new ListUsersByPermissionUseCase(
    permissionsRepository,
    userDirectPermissionsRepository,
    tenantUsersRepository,
  );
}
