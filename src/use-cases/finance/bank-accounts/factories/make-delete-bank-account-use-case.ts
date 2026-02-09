import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { DeleteBankAccountUseCase } from '../delete-bank-account';

export function makeDeleteBankAccountUseCase() {
  const repository = new PrismaBankAccountsRepository();
  return new DeleteBankAccountUseCase(repository);
}
