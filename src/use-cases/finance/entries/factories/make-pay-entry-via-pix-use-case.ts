import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { PayEntryViaPixUseCase } from '../pay-entry-via-pix';

export function makePayEntryViaPixUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();
  const transactionManager = new PrismaTransactionManager();

  return new PayEntryViaPixUseCase(
    financeEntriesRepository,
    paymentsRepository,
    transactionManager,
  );
}
