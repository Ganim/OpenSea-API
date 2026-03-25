import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { CalculateCustomerScoreUseCase } from '../calculate-customer-score';

export function makeCalculateCustomerScoreUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  return new CalculateCustomerScoreUseCase(entriesRepository);
}
