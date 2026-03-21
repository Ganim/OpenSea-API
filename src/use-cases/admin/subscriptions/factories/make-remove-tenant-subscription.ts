import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { RemoveTenantSubscriptionUseCase } from '../remove-tenant-subscription';

export function makeRemoveTenantSubscriptionUseCase() {
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();

  return new RemoveTenantSubscriptionUseCase(tenantSubscriptionsRepository);
}
