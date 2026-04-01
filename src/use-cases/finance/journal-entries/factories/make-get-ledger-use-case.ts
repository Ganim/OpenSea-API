import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { GetLedgerUseCase } from '../get-ledger';

export function makeGetLedgerUseCase() {
  const chartOfAccountsRepository = new PrismaChartOfAccountsRepository();
  const journalEntriesRepository = new PrismaJournalEntriesRepository();
  return new GetLedgerUseCase(chartOfAccountsRepository, journalEntriesRepository);
}
