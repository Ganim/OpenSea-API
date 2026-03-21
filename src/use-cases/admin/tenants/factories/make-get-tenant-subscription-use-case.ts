import { PrismaSkillPricingRepository } from '@/repositories/core/prisma/prisma-skill-pricing-repository';
import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { GetTenantSubscriptionUseCase } from '../get-tenant-subscription';

export function makeGetTenantSubscriptionUseCase() {
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();
  const skillPricingRepository = new PrismaSkillPricingRepository();

  return new GetTenantSubscriptionUseCase(
    tenantSubscriptionsRepository,
    skillPricingRepository,
  );
}
