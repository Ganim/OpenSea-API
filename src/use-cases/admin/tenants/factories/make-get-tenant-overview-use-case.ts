import { PrismaSkillPricingRepository } from '@/repositories/core/prisma/prisma-skill-pricing-repository';
import { PrismaTenantIntegrationStatusRepository } from '@/repositories/core/prisma/prisma-tenant-integration-status-repository';
import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { PrismaTenantUsersRepository } from '@/repositories/core/prisma/prisma-tenant-users-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { GetTenantOverviewUseCase } from '../get-tenant-overview';

export function makeGetTenantOverviewUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();
  const skillPricingRepository = new PrismaSkillPricingRepository();
  const tenantUsersRepository = new PrismaTenantUsersRepository();
  const tenantIntegrationStatusRepository =
    new PrismaTenantIntegrationStatusRepository();

  return new GetTenantOverviewUseCase(
    tenantsRepository,
    tenantSubscriptionsRepository,
    skillPricingRepository,
    tenantUsersRepository,
    tenantIntegrationStatusRepository,
  );
}
