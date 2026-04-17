import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { GetCashflowUseCase } from '../get-cashflow';

export function makeGetCashflowUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();

  return new GetCashflowUseCase(
    entriesRepository,
    bankAccountsRepository,
    paymentsRepository,
  );
}
