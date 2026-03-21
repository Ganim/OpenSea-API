import { PrismaTenantBillingsRepository } from '@/repositories/core/prisma/prisma-tenant-billings-repository';
import { GetTenantBillingUseCase } from '../get-tenant-billing';

export function makeGetTenantBillingUseCase() {
  const tenantBillingsRepository = new PrismaTenantBillingsRepository();
  return new GetTenantBillingUseCase(tenantBillingsRepository);
}
