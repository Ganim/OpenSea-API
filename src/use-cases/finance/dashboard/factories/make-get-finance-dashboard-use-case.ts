import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetFinanceDashboardUseCase } from '../get-finance-dashboard';

export function makeGetFinanceDashboardUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new GetFinanceDashboardUseCase(entriesRepository, bankAccountsRepository);
}
