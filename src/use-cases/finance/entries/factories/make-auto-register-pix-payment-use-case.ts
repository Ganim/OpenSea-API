import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { AutoRegisterPixPaymentUseCase } from '../auto-register-pix-payment';

export function makeAutoRegisterPixPaymentUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();
  const transactionManager = new PrismaTransactionManager();

  return new AutoRegisterPixPaymentUseCase(
    financeEntriesRepository,
    paymentsRepository,
    transactionManager,
  );
}
