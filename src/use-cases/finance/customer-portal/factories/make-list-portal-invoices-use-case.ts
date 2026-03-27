import { PrismaCustomerPortalAccessesRepository } from '@/repositories/finance/prisma/prisma-customer-portal-accesses-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { ListPortalInvoicesUseCase } from '../list-portal-invoices';

export function makeListPortalInvoicesUseCase() {
  const portalAccessesRepository = new PrismaCustomerPortalAccessesRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new ListPortalInvoicesUseCase(
    portalAccessesRepository,
    financeEntriesRepository,
  );
}
