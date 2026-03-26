import { PrismaBankConnectionsRepository } from '@/repositories/finance/prisma/prisma-bank-connections-repository';
import { DisconnectBankUseCase } from '../disconnect-bank';

export function makeDisconnectBankUseCase() {
  const bankConnectionsRepository = new PrismaBankConnectionsRepository();

  return new DisconnectBankUseCase(bankConnectionsRepository);
}
