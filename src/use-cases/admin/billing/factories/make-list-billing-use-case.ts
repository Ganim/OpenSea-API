import { PrismaTenantBillingsRepository } from '@/repositories/core/prisma/prisma-tenant-billings-repository';
import { ListBillingUseCase } from '../list-billing';

export function makeListBillingUseCase() {
  const tenantBillingsRepository = new PrismaTenantBillingsRepository();
  return new ListBillingUseCase(tenantBillingsRepository);
}
