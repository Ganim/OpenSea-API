import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { PrismaContractsRepository } from '@/repositories/finance/prisma/prisma-contracts-repository';
import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaLoansRepository } from '@/repositories/finance/prisma/prisma-loans-repository';
import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { GetFinanceOverviewUseCase } from '../get-finance-overview';

export function makeGetFinanceOverviewUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const loansRepository = new PrismaLoansRepository();
  const consortiaRepository = new PrismaConsortiaRepository();
  const contractsRepository = new PrismaContractsRepository();
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const financeCategoriesRepository = new PrismaFinanceCategoriesRepository();
  const costCentersRepository = new PrismaCostCentersRepository();

  return new GetFinanceOverviewUseCase(
    entriesRepository,
    loansRepository,
    consortiaRepository,
    contractsRepository,
    recurringConfigsRepository,
    bankAccountsRepository,
    financeCategoriesRepository,
    costCentersRepository,
  );
}
