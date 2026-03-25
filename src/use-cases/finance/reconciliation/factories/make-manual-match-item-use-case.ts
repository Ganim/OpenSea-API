import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { ManualMatchItemUseCase } from '../manual-match-item';

export function makeManualMatchItemUseCase() {
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();

  return new ManualMatchItemUseCase(
    reconciliationsRepository,
    financeEntriesRepository,
  );
}
