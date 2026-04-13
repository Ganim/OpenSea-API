import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaBankConnectionsRepository } from '@/repositories/finance/prisma/prisma-bank-connections-repository';
import { PluggyProvider } from '@/services/banking/pluggy.provider';
import type { BankingProvider } from '@/services/banking/pluggy-provider.interface';
import { ConnectBankUseCase } from '../connect-bank';

export function makeConnectBankUseCase() {
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const bankConnectionsRepository = new PrismaBankConnectionsRepository();
  const pluggyProvider = new PluggyProvider() as unknown as BankingProvider;

  return new ConnectBankUseCase(
    bankAccountsRepository,
    bankConnectionsRepository,
    pluggyProvider,
  );
}
