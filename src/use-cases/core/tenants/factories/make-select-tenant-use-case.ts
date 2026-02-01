import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { SelectTenantUseCase } from '../select-tenant';

export function makeSelectTenantUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  return new SelectTenantUseCase(tenantsRepository, tenantUsersRepository);
}
