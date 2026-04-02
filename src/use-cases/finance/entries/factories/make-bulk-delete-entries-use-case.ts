import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { BulkDeleteEntriesUseCase } from '../bulk-delete-entries';

export function makeBulkDeleteEntriesUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const transactionManager = new PrismaTransactionManager();
  const approvalRulesRepository = new PrismaFinanceApprovalRulesRepository();

  return new BulkDeleteEntriesUseCase(
    entriesRepository,
    transactionManager,
    approvalRulesRepository,
  );
}
