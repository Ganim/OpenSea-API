import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { ImportOfxReconciliationUseCase } from '../import-ofx-reconciliation';

export function makeImportOfxReconciliationUseCase() {
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();

  return new ImportOfxReconciliationUseCase(
    bankAccountsRepository,
    reconciliationsRepository,
    financeEntriesRepository,
  );
}
