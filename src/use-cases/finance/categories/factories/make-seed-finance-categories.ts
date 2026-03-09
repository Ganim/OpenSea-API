import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { SeedFinanceCategoriesUseCase } from '../seed-finance-categories';

export function makeSeedFinanceCategoriesUseCase() {
  const repository = new PrismaFinanceCategoriesRepository();
  return new SeedFinanceCategoriesUseCase(repository);
}
