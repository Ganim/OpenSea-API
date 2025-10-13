import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { UpdateCategoryUseCase } from '../update-category';

export function makeUpdateCategoryUseCase() {
  const categoriesRepository = new PrismaCategoriesRepository();
  const updateCategoryUseCase = new UpdateCategoryUseCase(categoriesRepository);
  return updateCategoryUseCase;
}
