import { PrismaCustomerPortalAccessesRepository } from '@/repositories/finance/prisma/prisma-customer-portal-accesses-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GeneratePortalPaymentUseCase } from '../generate-portal-payment';

export function makeGeneratePortalPaymentUseCase() {
  const portalAccessesRepository = new PrismaCustomerPortalAccessesRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new GeneratePortalPaymentUseCase(
    portalAccessesRepository,
    financeEntriesRepository,
  );
}
