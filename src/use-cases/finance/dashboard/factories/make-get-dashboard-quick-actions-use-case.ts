import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetDashboardQuickActionsUseCase } from '../get-dashboard-quick-actions';

export function makeGetDashboardQuickActionsUseCase() {
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const bankReconciliationsRepository =
    new PrismaBankReconciliationsRepository();
  return new GetDashboardQuickActionsUseCase(
    financeEntriesRepository,
    bankReconciliationsRepository,
  );
}
