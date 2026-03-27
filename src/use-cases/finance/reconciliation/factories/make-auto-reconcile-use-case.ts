import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaReconciliationSuggestionsRepository } from '@/repositories/finance/prisma/prisma-reconciliation-suggestions-repository';
import { AutoReconcileUseCase } from '../auto-reconcile';

export function makeAutoReconcileUseCase() {
  const bankReconciliationsRepository =
    new PrismaBankReconciliationsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const reconciliationSuggestionsRepository =
    new PrismaReconciliationSuggestionsRepository();

  return new AutoReconcileUseCase(
    bankReconciliationsRepository,
    financeEntriesRepository,
    reconciliationSuggestionsRepository,
  );
}
