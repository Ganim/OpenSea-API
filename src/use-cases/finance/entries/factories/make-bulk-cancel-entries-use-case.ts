import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { BulkCancelEntriesUseCase } from '../bulk-cancel-entries';

export function makeBulkCancelEntriesUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const transactionManager = new PrismaTransactionManager();
  const approvalRulesRepository = new PrismaFinanceApprovalRulesRepository();

  return new BulkCancelEntriesUseCase(
    entriesRepository,
    transactionManager,
    approvalRulesRepository,
  );
}
