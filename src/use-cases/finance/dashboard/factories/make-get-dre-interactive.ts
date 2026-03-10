import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetInteractiveDREUseCase } from '../get-dre-interactive';

export function makeGetInteractiveDREUseCase() {
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const entriesRepository = new PrismaFinanceEntriesRepository();
  return new GetInteractiveDREUseCase(categoriesRepository, entriesRepository);
}
