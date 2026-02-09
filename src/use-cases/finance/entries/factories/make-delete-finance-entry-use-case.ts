import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { DeleteFinanceEntryUseCase } from '../delete-finance-entry';

export function makeDeleteFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();

  return new DeleteFinanceEntryUseCase(entriesRepository);
}
