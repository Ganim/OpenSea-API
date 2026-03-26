import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { DetectAnomaliesUseCase } from '../detect-anomalies';

export function makeDetectAnomaliesUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();

  return new DetectAnomaliesUseCase(entriesRepository, categoriesRepository);
}
