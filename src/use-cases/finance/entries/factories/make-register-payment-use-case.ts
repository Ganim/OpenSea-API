import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaChartOfAccountsRepository } from '@/repositories/finance/prisma/prisma-chart-of-accounts-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { AutoJournalFromPaymentUseCase } from '@/use-cases/finance/journal-entries/auto-journal-from-payment';
import { RegisterPaymentUseCase } from '../register-payment';

export function makeRegisterPaymentUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();
  const calendarSyncService = makeCalendarSyncService();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const transactionManager = new PrismaTransactionManager();

  const journalEntriesRepository = new PrismaJournalEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const chartOfAccountsRepository = new PrismaChartOfAccountsRepository();
  const autoJournalFromPayment = new AutoJournalFromPaymentUseCase(
    entriesRepository,
    bankAccountsRepository,
    chartOfAccountsRepository,
    journalEntriesRepository,
  );

  return new RegisterPaymentUseCase(
    entriesRepository,
    paymentsRepository,
    calendarSyncService,
    categoriesRepository,
    transactionManager,
    autoJournalFromPayment,
  );
}
