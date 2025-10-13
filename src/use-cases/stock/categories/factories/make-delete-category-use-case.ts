import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { DeleteCategoryUseCase } from '../delete-category';

export function makeDeleteCategoryUseCase() {
  const categoriesRepository = new PrismaCategoriesRepository();
  const deleteCategoryUseCase = new DeleteCategoryUseCase(categoriesRepository);
  return deleteCategoryUseCase;
}
