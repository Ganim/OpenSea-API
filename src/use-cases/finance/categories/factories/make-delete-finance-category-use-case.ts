import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { DeleteFinanceCategoryUseCase } from '../delete-finance-category';

export function makeDeleteFinanceCategoryUseCase() {
  const repository = new PrismaFinanceCategoriesRepository();
  return new DeleteFinanceCategoryUseCase(repository);
}
