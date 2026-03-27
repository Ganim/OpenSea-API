import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { FinanceNaturalQueryUseCase } from '../finance-natural-query';

export function makeFinanceNaturalQueryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new FinanceNaturalQueryUseCase(
    entriesRepository,
    bankAccountsRepository,
  );
}
