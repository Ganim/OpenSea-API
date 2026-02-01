import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaTenantPlansRepository } from '@/repositories/core/prisma/prisma-tenant-plans-repository';
import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { CreateTenantUseCase } from '../create-tenant';

export function makeCreateTenantUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  const tenantPlansRepository = new PrismaTenantPlansRepository();
  const plansRepository = new PrismaPlansRepository();

  return new CreateTenantUseCase(
    tenantsRepository,
    tenantUsersRepository,
    tenantPlansRepository,
    plansRepository,
  );
}
