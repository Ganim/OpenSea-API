import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { GetBankAccountByIdUseCase } from '../get-bank-account-by-id';

export function makeGetBankAccountByIdUseCase() {
  const repository = new PrismaBankAccountsRepository();
  return new GetBankAccountByIdUseCase(repository);
}
