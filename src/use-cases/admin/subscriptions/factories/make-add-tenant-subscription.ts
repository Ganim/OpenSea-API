import { PrismaSystemSkillDefinitionsRepository } from '@/repositories/core/prisma/prisma-system-skill-definitions-repository';
import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { AddTenantSubscriptionUseCase } from '../add-tenant-subscription';

export function makeAddTenantSubscriptionUseCase() {
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();
  const tenantsRepository = new PrismaTenantsRepository();
  const skillDefinitionsRepository =
    new PrismaSystemSkillDefinitionsRepository();

  return new AddTenantSubscriptionUseCase(
    tenantSubscriptionsRepository,
    tenantsRepository,
    skillDefinitionsRepository,
  );
}
