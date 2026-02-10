import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetCashflowUseCase } from '../get-cashflow';

export function makeGetCashflowUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new GetCashflowUseCase(entriesRepository, bankAccountsRepository);
}
