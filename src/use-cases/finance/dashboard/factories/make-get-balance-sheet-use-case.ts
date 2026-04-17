import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { GetBalanceSheetUseCase } from '../get-balance-sheet';

export function makeGetBalanceSheetUseCase() {
  const chartOfAccountsRepository = new PrismaChartOfAccountsRepository();
  const journalEntriesRepository = new PrismaJournalEntriesRepository();
  return new GetBalanceSheetUseCase(
    chartOfAccountsRepository,
    journalEntriesRepository,
  );
}
