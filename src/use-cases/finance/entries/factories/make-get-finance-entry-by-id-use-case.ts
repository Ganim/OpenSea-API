import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { GetFinanceEntryByIdUseCase } from '../get-finance-entry-by-id';

export function makeGetFinanceEntryByIdUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();

  return new GetFinanceEntryByIdUseCase(entriesRepository, paymentsRepository);
}
