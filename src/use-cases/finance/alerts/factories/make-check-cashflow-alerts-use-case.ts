import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { CheckCashFlowAlertsUseCase } from '../check-cashflow-alerts';

export function makeCheckCashFlowAlertsUseCase() {
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  return new CheckCashFlowAlertsUseCase(
    bankAccountsRepository,
    financeEntriesRepository,
  );
}
