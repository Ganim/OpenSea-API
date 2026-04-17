import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { PrismaReconciliationSuggestionsRepository } from '@/repositories/finance/prisma/prisma-reconciliation-suggestions-repository';
import { AcceptReconciliationSuggestionUseCase } from '../accept-reconciliation-suggestion';

export function makeAcceptReconciliationSuggestionUseCase() {
  const suggestionsRepository = new PrismaReconciliationSuggestionsRepository();
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();
  const transactionManager = new PrismaTransactionManager();

  return new AcceptReconciliationSuggestionUseCase(
    suggestionsRepository,
    reconciliationsRepository,
    entriesRepository,
    paymentsRepository,
    transactionManager,
  );
}
