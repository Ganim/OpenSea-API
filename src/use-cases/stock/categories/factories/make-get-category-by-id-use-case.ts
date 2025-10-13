import { PrismaCategoriesRepository } from '@/repositories/stock/prisma/prisma-categories-repository';
import { GetCategoryByIdUseCase } from '../get-category-by-id';

export function makeGetCategoryByIdUseCase() {
  const categoriesRepository = new PrismaCategoriesRepository();
  const getCategoryByIdUseCase = new GetCategoryByIdUseCase(
    categoriesRepository,
  );
  return getCategoryByIdUseCase;
}
