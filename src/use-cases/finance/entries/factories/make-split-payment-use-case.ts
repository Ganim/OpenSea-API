import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { SplitPaymentUseCase } from '../split-payment';

export function makeSplitPaymentUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();
  const transactionManager = new PrismaTransactionManager();

  return new SplitPaymentUseCase(
    entriesRepository,
    paymentsRepository,
    transactionManager,
  );
}
