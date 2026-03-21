import { PrismaTenantBillingsRepository } from '@/repositories/core/prisma/prisma-tenant-billings-repository';
import { MarkBillingPaidUseCase } from '../mark-billing-paid';

export function makeMarkBillingPaidUseCase() {
  const tenantBillingsRepository = new PrismaTenantBillingsRepository();
  return new MarkBillingPaidUseCase(tenantBillingsRepository);
}
