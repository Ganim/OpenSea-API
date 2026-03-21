import { PrismaTenantBillingsRepository } from '@/repositories/core/prisma/prisma-tenant-billings-repository';
import { PrismaTenantConsumptionsRepository } from '@/repositories/core/prisma/prisma-tenant-consumptions-repository';
import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { GetTenantOverviewUseCase } from '../get-tenant-overview';

export function makeGetTenantOverviewUseCase() {
  const tenantSubscriptionsRepository =
    new PrismaTenantSubscriptionsRepository();
  const tenantConsumptionsRepository = new PrismaTenantConsumptionsRepository();
  const tenantBillingsRepository = new PrismaTenantBillingsRepository();

  return new GetTenantOverviewUseCase(
    tenantSubscriptionsRepository,
    tenantConsumptionsRepository,
    tenantBillingsRepository,
  );
}
