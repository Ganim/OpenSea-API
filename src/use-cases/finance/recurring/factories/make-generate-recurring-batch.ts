import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { GenerateRecurringBatchUseCase } from '../generate-recurring-batch';

export function makeGenerateRecurringBatchUseCase() {
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new GenerateRecurringBatchUseCase(
    recurringConfigsRepository,
    financeEntriesRepository,
  );
}
