import { PrismaCustomerPortalAccessesRepository } from '@/repositories/finance/prisma/prisma-customer-portal-accesses-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetPortalInvoiceUseCase } from '../get-portal-invoice';

export function makeGetPortalInvoiceUseCase() {
  const portalAccessesRepository = new PrismaCustomerPortalAccessesRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new GetPortalInvoiceUseCase(
    portalAccessesRepository,
    financeEntriesRepository,
  );
}
