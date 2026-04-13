import { PrismaBankConnectionsRepository } from '@/repositories/finance/prisma/prisma-bank-connections-repository';
import { ListBankConnectionsUseCase } from '../list-bank-connections';

export function makeListBankConnectionsUseCase() {
  const bankConnectionsRepository = new PrismaBankConnectionsRepository();

  return new ListBankConnectionsUseCase(bankConnectionsRepository);
}
