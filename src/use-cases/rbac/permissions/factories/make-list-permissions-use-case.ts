import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { ListPermissionsUseCase } from '../list-permissions';

export function makeListPermissionsUseCase() {
  const permissionsRepository = new PrismaPermissionsRepository();
  return new ListPermissionsUseCase(permissionsRepository);
}
