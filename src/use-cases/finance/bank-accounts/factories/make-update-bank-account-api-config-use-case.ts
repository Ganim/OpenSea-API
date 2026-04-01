import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { UpdateBankAccountApiConfigUseCase } from '../update-bank-account-api-config';

export function makeUpdateBankAccountApiConfigUseCase() {
  const repository = new PrismaBankAccountsRepository();
  return new UpdateBankAccountApiConfigUseCase(repository);
}
