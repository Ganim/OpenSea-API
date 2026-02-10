import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GenerateRecurringEntriesUseCase } from '../generate-recurring-entries';

export function makeGenerateRecurringEntriesUseCase() {
  const repository = new PrismaFinanceEntriesRepository();
  return new GenerateRecurringEntriesUseCase(repository);
}
