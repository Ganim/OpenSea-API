import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { CreateFinanceCategoryUseCase } from '../create-finance-category';

export function makeCreateFinanceCategoryUseCase() {
  const repository = new PrismaFinanceCategoriesRepository();
  return new CreateFinanceCategoryUseCase(repository);
}
