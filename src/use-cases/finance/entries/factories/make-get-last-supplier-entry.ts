import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetLastSupplierEntryUseCase } from '../get-last-supplier-entry';

export function makeGetLastSupplierEntryUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new GetLastSupplierEntryUseCase(financeEntriesRepository);
}
