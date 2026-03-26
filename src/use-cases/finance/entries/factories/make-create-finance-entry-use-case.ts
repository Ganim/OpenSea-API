import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { PrismaFinanceEntryCostCentersRepository } from '@/repositories/finance/prisma/prisma-finance-entry-cost-centers-repository';
import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { makeEvaluateAutoApprovalUseCase } from '@/use-cases/finance/approval-rules/factories/make-evaluate-auto-approval-use-case';
import { CreateFinanceEntryUseCase } from '../create-finance-entry';

export function makeCreateFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const costCentersRepository = new PrismaCostCentersRepository();
  const calendarSyncService = makeCalendarSyncService();
  const transactionManager = new PrismaTransactionManager();
  const costCenterAllocationsRepository =
    new PrismaFinanceEntryCostCentersRepository();
  const approvalRulesRepository = new PrismaFinanceApprovalRulesRepository();

  const evaluateAutoApproval = async (
    entryId: string,
    tenantId: string,
    createdBy?: string,
  ) => {
    // Only evaluate if there are active rules
    const rules = await approvalRulesRepository.findActiveByTenant(tenantId);
    if (rules.length === 0) return;

    const evaluateUseCase = makeEvaluateAutoApprovalUseCase();
    await evaluateUseCase.execute({ entryId, tenantId, createdBy });
  };

  return new CreateFinanceEntryUseCase(
    entriesRepository,
    categoriesRepository,
    costCentersRepository,
    calendarSyncService,
    transactionManager,
    costCenterAllocationsRepository,
    approvalRulesRepository,
    evaluateAutoApproval,
  );
}
