import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { UpdateMarketplaceConnectionUseCase } from '../update-marketplace-connection';

export function makeUpdateMarketplaceConnectionUseCase() {
  const repository = new PrismaMarketplaceConnectionsRepository();
  return new UpdateMarketplaceConnectionUseCase(repository);
}
