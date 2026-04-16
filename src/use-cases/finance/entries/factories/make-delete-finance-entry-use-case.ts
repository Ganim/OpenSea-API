import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { buildPrismaPeriodLockChecker } from '@/utils/finance/period-lock-guard';
import { DeleteFinanceEntryUseCase } from '../delete-finance-entry';

export function makeDeleteFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const periodLockChecker = buildPrismaPeriodLockChecker();

  return new DeleteFinanceEntryUseCase(entriesRepository, periodLockChecker);
}
