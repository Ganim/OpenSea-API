import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetPredictiveCashflowUseCase } from '../get-predictive-cashflow';

export function makeGetPredictiveCashflowUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new GetPredictiveCashflowUseCase(
    entriesRepository,
    bankAccountsRepository,
  );
}
