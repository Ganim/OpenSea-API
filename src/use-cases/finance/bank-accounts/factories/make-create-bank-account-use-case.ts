import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { CreateBankAccountUseCase } from '../create-bank-account';

export function makeCreateBankAccountUseCase() {
  const repository = new PrismaBankAccountsRepository();
  return new CreateBankAccountUseCase(repository);
}
