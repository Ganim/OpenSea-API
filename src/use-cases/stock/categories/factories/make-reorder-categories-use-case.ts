import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { ReorderCategoriesUseCase } from '../reorder-categories';

export function makeReorderCategoriesUseCase() {
  const categoriesRepository = new PrismaCategoriesRepository();
  const reorderCategoriesUseCase = new ReorderCategoriesUseCase(
    categoriesRepository,
  );
  return reorderCategoriesUseCase;
}
