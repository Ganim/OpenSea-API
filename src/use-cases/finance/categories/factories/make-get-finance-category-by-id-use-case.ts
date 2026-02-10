import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { GetFinanceCategoryByIdUseCase } from '../get-finance-category-by-id';

export function makeGetFinanceCategoryByIdUseCase() {
  const repository = new PrismaFinanceCategoriesRepository();
  return new GetFinanceCategoryByIdUseCase(repository);
}
