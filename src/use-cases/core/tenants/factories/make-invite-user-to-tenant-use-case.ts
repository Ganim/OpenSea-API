import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaTenantPlansRepository } from '@/repositories/core/prisma/prisma-tenant-plans-repository';
import { InviteUserToTenantUseCase } from '../invite-user-to-tenant';

export function makeInviteUserToTenantUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  const usersRepository = new PrismaUsersRepository();
  const tenantPlansRepository = new PrismaTenantPlansRepository();
  return new InviteUserToTenantUseCase(
    tenantsRepository,
    tenantUsersRepository,
    usersRepository,
    tenantPlansRepository,
  );
}
