import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { RegisterPaymentUseCase } from '../register-payment';

export function makeRegisterPaymentUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();
  const calendarSyncService = makeCalendarSyncService();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const transactionManager = new PrismaTransactionManager();

  return new RegisterPaymentUseCase(
    entriesRepository,
    paymentsRepository,
    calendarSyncService,
    categoriesRepository,
    transactionManager,
  );
}
