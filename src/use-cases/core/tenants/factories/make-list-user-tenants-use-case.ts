import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { ListUserTenantsUseCase } from '../list-user-tenants';

export function makeListUserTenantsUseCase() {
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  const tenantsRepository = new PrismaTenantsRepository();
  return new ListUserTenantsUseCase(tenantUsersRepository, tenantsRepository);
}
