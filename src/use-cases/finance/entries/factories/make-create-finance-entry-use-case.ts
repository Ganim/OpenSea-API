import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { PrismaFinanceEntryCostCentersRepository } from '@/repositories/finance/prisma/prisma-finance-entry-cost-centers-repository';
import { PrismaFinanceApprovalRulesRepository } from '@/repositories/finance/prisma/prisma-finance-approval-rules-repository';
import { PrismaFinanceEntryRetentionsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-retentions-repository';
import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { makeEvaluateAutoApprovalUseCase } from '@/use-cases/finance/approval-rules/factories/make-evaluate-auto-approval-use-case';
import { AutoJournalFromEntryUseCase } from '@/use-cases/finance/journal-entries/auto-journal-from-entry';
import { buildPrismaPeriodLockChecker } from '@/utils/finance/period-lock-guard';
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
  const retentionsRepository = new PrismaFinanceEntryRetentionsRepository();

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

  const journalEntriesRepository = new PrismaJournalEntriesRepository();
  const chartOfAccountsRepository = new PrismaChartOfAccountsRepository();
  const autoJournalFromEntry = new AutoJournalFromEntryUseCase(
    entriesRepository,
    categoriesRepository,
    chartOfAccountsRepository,
    journalEntriesRepository,
  );

  const periodLockChecker = buildPrismaPeriodLockChecker();

  return new CreateFinanceEntryUseCase(
    entriesRepository,
    categoriesRepository,
    costCentersRepository,
    calendarSyncService,
    transactionManager,
    costCenterAllocationsRepository,
    approvalRulesRepository,
    evaluateAutoApproval,
    retentionsRepository,
    autoJournalFromEntry,
    periodLockChecker,
  );
}
