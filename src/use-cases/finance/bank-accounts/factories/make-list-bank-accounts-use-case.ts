import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { ListBankAccountsUseCase } from '../list-bank-accounts';

export function makeListBankAccountsUseCase() {
  const repository = new PrismaBankAccountsRepository();
  return new ListBankAccountsUseCase(repository);
}
