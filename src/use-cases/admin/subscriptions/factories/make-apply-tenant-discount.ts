import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { ApplyTenantDiscountUseCase } from '../apply-tenant-discount';

export function makeApplyTenantDiscountUseCase() {
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();

  return new ApplyTenantDiscountUseCase(tenantSubscriptionsRepository);
}
