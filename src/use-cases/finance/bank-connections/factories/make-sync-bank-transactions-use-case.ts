import { PrismaBankConnectionsRepository } from '@/repositories/finance/prisma/prisma-bank-connections-repository';
import { PrismaBankReconciliationsRepository } from '@/repositories/finance/prisma/prisma-bank-reconciliations-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PluggyProvider } from '@/services/banking/pluggy.provider';
import { SyncBankTransactionsUseCase } from '../sync-bank-transactions';

export function makeSyncBankTransactionsUseCase() {
  const bankConnectionsRepository = new PrismaBankConnectionsRepository();
  const bankReconciliationsRepository =
    new PrismaBankReconciliationsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const pluggyProvider = new PluggyProvider();

  return new SyncBankTransactionsUseCase(
    bankConnectionsRepository,
    bankReconciliationsRepository,
    financeEntriesRepository,
    pluggyProvider,
  );
}
