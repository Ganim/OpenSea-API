import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { ListTenantUsersUseCase } from '../list-tenant-users';

export function makeListTenantUsersUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  const usersRepository = new PrismaUsersRepository();
  return new ListTenantUsersUseCase(
    tenantsRepository,
    tenantUsersRepository,
    usersRepository,
  );
}
