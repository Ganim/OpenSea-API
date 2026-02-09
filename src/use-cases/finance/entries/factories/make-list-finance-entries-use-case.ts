import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { ListFinanceEntriesUseCase } from '../list-finance-entries';

export function makeListFinanceEntriesUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();

  return new ListFinanceEntriesUseCase(entriesRepository);
}
