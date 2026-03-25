import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { BulkDeleteEntriesUseCase } from '../bulk-delete-entries';

export function makeBulkDeleteEntriesUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const transactionManager = new PrismaTransactionManager();

  return new BulkDeleteEntriesUseCase(entriesRepository, transactionManager);
}
