import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { PrismaFinanceEntryCostCentersRepository } from '@/repositories/finance/prisma/prisma-finance-entry-cost-centers-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { CreateFinanceEntryUseCase } from '../create-finance-entry';

export function makeCreateFinanceEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const costCentersRepository = new PrismaCostCentersRepository();
  const calendarSyncService = makeCalendarSyncService();
  const transactionManager = new PrismaTransactionManager();
  const costCenterAllocationsRepository =
    new PrismaFinanceEntryCostCentersRepository();

  return new CreateFinanceEntryUseCase(
    entriesRepository,
    categoriesRepository,
    costCentersRepository,
    calendarSyncService,
    transactionManager,
    costCenterAllocationsRepository,
  );
}
