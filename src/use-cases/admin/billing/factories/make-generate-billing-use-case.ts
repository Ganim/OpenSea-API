import { PrismaTenantBillingsRepository } from '@/repositories/core/prisma/prisma-tenant-billings-repository';
import { GenerateBillingUseCase } from '../generate-billing';

export function makeGenerateBillingUseCase() {
  const tenantBillingsRepository = new PrismaTenantBillingsRepository();
  return new GenerateBillingUseCase(tenantBillingsRepository);
}
