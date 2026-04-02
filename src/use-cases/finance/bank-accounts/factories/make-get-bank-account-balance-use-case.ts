import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { getBankingProviderForAccount } from '@/services/banking/get-banking-provider';
import { GetBankAccountBalanceUseCase } from '../get-bank-account-balance';

export function makeGetBankAccountBalanceUseCase() {
  const repository = new PrismaBankAccountsRepository();
  return new GetBankAccountBalanceUseCase(
    repository,
    getBankingProviderForAccount,
  );
}
