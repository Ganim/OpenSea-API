import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { BulkCategorizeEntriesUseCase } from '../bulk-categorize-entries';

export function makeBulkCategorizeEntriesUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const transactionManager = new PrismaTransactionManager();

  return new BulkCategorizeEntriesUseCase(
    entriesRepository,
    categoriesRepository,
    transactionManager,
  );
}
