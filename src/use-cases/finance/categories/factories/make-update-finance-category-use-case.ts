import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { UpdateFinanceCategoryUseCase } from '../update-finance-category';

export function makeUpdateFinanceCategoryUseCase() {
  const repository = new PrismaFinanceCategoriesRepository();
  return new UpdateFinanceCategoryUseCase(repository);
}
