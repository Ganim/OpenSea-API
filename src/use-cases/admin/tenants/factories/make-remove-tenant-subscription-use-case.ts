import { PrismaSystemSkillDefinitionsRepository } from '@/repositories/core/prisma/prisma-system-skill-definitions-repository';
import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { SkillDependencyService } from '@/services/core/skill-dependency-service';
import { RemoveTenantSubscriptionUseCase } from '../remove-tenant-subscription';

export function makeRemoveTenantSubscriptionUseCase() {
  const skillDefinitionsRepository =
    new PrismaSystemSkillDefinitionsRepository();
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();
  const skillDependencyService = new SkillDependencyService(
    skillDefinitionsRepository,
    tenantSubscriptionsRepository,
  );

  return new RemoveTenantSubscriptionUseCase(
    skillDefinitionsRepository,
    tenantSubscriptionsRepository,
    skillDependencyService,
  );
}
