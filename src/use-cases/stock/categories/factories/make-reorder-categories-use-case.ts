import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { ReorderCategoriesUseCase } from '../reorder-categories';

export function makeReorderCategoriesUseCase() {
  const categoriesRepository = new PrismaCategoriesRepository();
  const transactionManager = new PrismaTransactionManager();
  const reorderCategoriesUseCase = new ReorderCategoriesUseCase(
    categoriesRepository,
    transactionManager,
  );
  return reorderCategoriesUseCase;
}
