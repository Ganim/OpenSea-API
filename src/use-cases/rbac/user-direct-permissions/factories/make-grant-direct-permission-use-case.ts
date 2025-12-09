import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserDirectPermissionsRepository } from '@/repositories/rbac/prisma/prisma-user-direct-permissions-repository';
import { GrantDirectPermissionUseCase } from '../grant-direct-permission';

export function makeGrantDirectPermissionUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const permissionsRepository = new PrismaPermissionsRepository();
  const userDirectPermissionsRepository =
    new PrismaUserDirectPermissionsRepository();

  return new GrantDirectPermissionUseCase(
    usersRepository,
    permissionsRepository,
    userDirectPermissionsRepository,
  );
}
