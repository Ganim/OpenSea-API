import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { CreateEntryFromItemUseCase } from '../create-entry-from-item';

export function makeCreateEntryFromItemUseCase() {
  const reconciliationsRepository = new PrismaBankReconciliationsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();

  return new CreateEntryFromItemUseCase(
    reconciliationsRepository,
    financeEntriesRepository,
  );
}
