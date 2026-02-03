import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaPermissionGroupPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permission-group-permissions-repository';
import { PrismaPermissionGroupsRepository } from '@/repositories/rbac/prisma/prisma-permission-groups-repository';
import { PrismaPermissionsRepository } from '@/repositories/rbac/prisma/prisma-permissions-repository';
import { CreateTenantAdminUseCase } from '../create-tenant-admin';

export function makeCreateTenantAdminUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const permissionGroupsRepository = new PrismaPermissionGroupsRepository();
  const permissionGroupPermissionsRepository =
    new PrismaPermissionGroupPermissionsRepository();
  const permissionsRepository = new PrismaPermissionsRepository();

  return new CreateTenantAdminUseCase(
    tenantsRepository,
    permissionGroupsRepository,
    permissionGroupPermissionsRepository,
    permissionsRepository,
  );
}
