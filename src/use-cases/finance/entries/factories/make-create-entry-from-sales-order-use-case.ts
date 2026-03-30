import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { CreateEntryFromSalesOrderUseCase } from '../create-entry-from-sales-order';

export function makeCreateEntryFromSalesOrderUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();

  return new CreateEntryFromSalesOrderUseCase(
    entriesRepository,
    categoriesRepository,
  );
}
