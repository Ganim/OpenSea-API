import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { buildPrismaPeriodLockChecker } from '@/utils/finance/period-lock-guard';
import { UpdateFinanceEntryUseCase } from '../update-finance-entry';

export function makeUpdateFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const periodLockChecker = buildPrismaPeriodLockChecker();

  return new UpdateFinanceEntryUseCase(entriesRepository, periodLockChecker);
}
