import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { PrismaUserDirectPermissionsRepository } from '@/repositories/rbac/prisma/prisma-user-direct-permissions-repository';
import { ListUserDirectPermissionsUseCase } from '../list-user-direct-permissions';

export function makeListUserDirectPermissionsUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const permissionsRepository = new PrismaPermissionsRepository();
  const userDirectPermissionsRepository =
    new PrismaUserDirectPermissionsRepository();

  return new ListUserDirectPermissionsUseCase(
    usersRepository,
    permissionsRepository,
    userDirectPermissionsRepository,
  );
}
