import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { BulkCancelEntriesUseCase } from '../bulk-cancel-entries';

export function makeBulkCancelEntriesUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const transactionManager = new PrismaTransactionManager();

  return new BulkCancelEntriesUseCase(entriesRepository, transactionManager);
}
