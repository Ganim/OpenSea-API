import { PrismaTenantConsumptionsRepository } from '@/repositories/core/prisma/prisma-tenant-consumptions-repository';
import { GetTenantConsumptionUseCase } from '../get-tenant-consumption';

export function makeGetTenantConsumptionUseCase() {
  const tenantConsumptionsRepository = new PrismaTenantConsumptionsRepository();

  return new GetTenantConsumptionUseCase(tenantConsumptionsRepository);
}
