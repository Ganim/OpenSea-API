import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { ListFinanceCategoriesUseCase } from '../list-finance-categories';

export function makeListFinanceCategoriesUseCase() {
  const repository = new PrismaFinanceCategoriesRepository();
  return new ListFinanceCategoriesUseCase(repository);
}
