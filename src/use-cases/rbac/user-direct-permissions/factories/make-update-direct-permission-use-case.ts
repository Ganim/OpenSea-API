import { PrismaUserDirectPermissionsRepository } from '@/repositories/rbac/prisma/prisma-user-direct-permissions-repository';
import { UpdateDirectPermissionUseCase } from '../update-direct-permission';

export function makeUpdateDirectPermissionUseCase() {
  const userDirectPermissionsRepository =
    new PrismaUserDirectPermissionsRepository();

  return new UpdateDirectPermissionUseCase(userDirectPermissionsRepository);
}
