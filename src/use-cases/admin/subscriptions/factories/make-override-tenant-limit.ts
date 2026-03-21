import { PrismaTenantConsumptionsRepository } from '@/repositories/core/prisma/prisma-tenant-consumptions-repository';
import { OverrideTenantLimitUseCase } from '../override-tenant-limit';

export function makeOverrideTenantLimitUseCase() {
  const tenantConsumptionsRepository = new PrismaTenantConsumptionsRepository();

  return new OverrideTenantLimitUseCase(tenantConsumptionsRepository);
}
