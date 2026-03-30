import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { SuggestCategoryUseCase } from '../suggest-category';

export function makeSuggestCategoryUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new SuggestCategoryUseCase(financeEntriesRepository);
}
