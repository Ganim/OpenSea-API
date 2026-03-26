import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryRetentionsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-retentions-repository';
import { ApplyEntryRetentionsUseCase } from '../apply-entry-retentions';

export function makeApplyEntryRetentionsUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const retentionsRepository = new PrismaFinanceEntryRetentionsRepository();

  return new ApplyEntryRetentionsUseCase(
    entriesRepository,
    retentionsRepository,
  );
}
