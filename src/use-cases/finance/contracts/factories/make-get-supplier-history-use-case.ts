import { PrismaContractsRepository } from '@/repositories/finance/prisma/prisma-contracts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetSupplierHistoryUseCase } from '../get-supplier-history';

export function makeGetSupplierHistoryUseCase() {
  return new GetSupplierHistoryUseCase(
    new PrismaContractsRepository(),
    new PrismaFinanceEntriesRepository(),
  );
}
