import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { GetTenantSubscriptionUseCase } from '../get-tenant-subscription';

export function makeGetTenantSubscriptionUseCase() {
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();

  return new GetTenantSubscriptionUseCase(tenantSubscriptionsRepository);
}
