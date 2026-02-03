import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaUserPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-user-permission-groups-repository';
import { CreateTenantUserAdminUseCase } from '../create-tenant-user-admin';

export function makeCreateTenantUserAdminUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const usersRepository = new PrismaUsersRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const userPermissionGroupsRepository =
    new PrismaUserPermissionGroupsRepository();

  return new CreateTenantUserAdminUseCase(
    tenantsRepository,
    usersRepository,
    tenantUsersRepository,
    permissionGroupsRepository,
    userPermissionGroupsRepository,
  );
}
