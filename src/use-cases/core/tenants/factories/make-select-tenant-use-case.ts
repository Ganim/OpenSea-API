import { PrismaSessionsRepository } from '@/repositories/core/prisma/prisma-sessions-repository';
import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { SelectTenantUseCase } from '../select-tenant';

export function makeSelectTenantUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  const sessionsRepository = new PrismaSessionsRepository();
  return new SelectTenantUseCase(
    tenantsRepository,
    tenantUsersRepository,
    sessionsRepository,
  );
}
