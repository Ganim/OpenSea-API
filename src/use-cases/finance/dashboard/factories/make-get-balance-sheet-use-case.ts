import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetBalanceSheetUseCase } from '../get-balance-sheet';

export function makeGetBalanceSheetUseCase() {
  const chartOfAccountsRepository = new PrismaChartOfAccountsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new GetBalanceSheetUseCase(
    chartOfAccountsRepository,
    financeEntriesRepository,
  );
}
