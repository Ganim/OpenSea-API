import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaCashflowSnapshotsRepository } from '@/repositories/finance/prisma/prisma-cashflow-snapshots-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { CalculateFinancialHealthUseCase } from '../calculate-financial-health';

export function makeCalculateFinancialHealthUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const cashflowSnapshotsRepository = new PrismaCashflowSnapshotsRepository();

  return new CalculateFinancialHealthUseCase(
    entriesRepository,
    bankAccountsRepository,
    cashflowSnapshotsRepository,
  );
}
