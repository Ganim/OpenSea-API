import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { UpdateFinanceEntryUseCase } from '../update-finance-entry';

export function makeUpdateFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();

  return new UpdateFinanceEntryUseCase(entriesRepository);
}
