import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { GetBankAccountHealthUseCase } from '../get-bank-account-health';

export function makeGetBankAccountHealthUseCase() {
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  return new GetBankAccountHealthUseCase(
    bankAccountsRepository,
    getBankingProviderForAccount,
  );
}
