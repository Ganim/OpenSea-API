import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { CancelFinanceEntryUseCase } from '../cancel-finance-entry';

export function makeCancelFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();

  return new CancelFinanceEntryUseCase(entriesRepository);
}
