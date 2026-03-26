import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetSupplierSummaryUseCase } from '../get-supplier-summary';

export function makeGetSupplierSummaryUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new GetSupplierSummaryUseCase(financeEntriesRepository);
}
