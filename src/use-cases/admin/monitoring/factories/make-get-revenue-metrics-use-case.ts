import { PrismaTenantConsumptionsRepository } from '@/repositories/core/prisma/prisma-tenant-consumptions-repository';
import { PrismaTenantSubscriptionsRepository } from '@/repositories/core/prisma/prisma-tenant-subscriptions-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { GetRevenueMetricsUseCase } from '../get-revenue-metrics';

export function makeGetRevenueMetricsUseCase() {
  const subscriptionsRepository = new PrismaTenantSubscriptionsRepository();
  const consumptionsRepository = new PrismaTenantConsumptionsRepository();
  const tenantsRepository = new PrismaTenantsRepository();
  return new GetRevenueMetricsUseCase(
    subscriptionsRepository,
    consumptionsRepository,
    tenantsRepository,
  );
}
