import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetForecastUseCase } from '../get-forecast';

export function makeGetForecastUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();

  return new GetForecastUseCase(entriesRepository);
}
