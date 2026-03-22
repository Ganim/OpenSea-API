import { PrismaSkillPricingRepository } from '@/repositories/core/prisma/prisma-skill-pricing-repository';
import { PrismaSystemSkillDefinitionsRepository } from '@/repositories/core/prisma/prisma-system-skill-definitions-repository';
import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { SkillDependencyService } from '@/services/core/skill-dependency-service';
import { AddTenantSubscriptionUseCase } from '../add-tenant-subscription';

export function makeAddTenantSubscriptionUseCase() {
  const skillDefinitionsRepository =
    new PrismaSystemSkillDefinitionsRepository();
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();
  const skillPricingRepository = new PrismaSkillPricingRepository();
  const skillDependencyService = new SkillDependencyService(
    skillDefinitionsRepository,
    tenantSubscriptionsRepository,
  );

  return new AddTenantSubscriptionUseCase(
    skillDefinitionsRepository,
    tenantSubscriptionsRepository,
    skillPricingRepository,
    skillDependencyService,
  );
}
