import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { CalculateEntryRetentionsUseCase } from '../calculate-entry-retentions';

export function makeCalculateEntryRetentionsUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();

  return new CalculateEntryRetentionsUseCase(entriesRepository);
}
