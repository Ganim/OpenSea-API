import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { UpdateBankAccountUseCase } from '../update-bank-account';

export function makeUpdateBankAccountUseCase() {
  const repository = new PrismaBankAccountsRepository();
  return new UpdateBankAccountUseCase(repository);
}
