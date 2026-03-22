import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { ListMarketplaceConnectionsUseCase } from '../list-marketplace-connections';

export function makeListMarketplaceConnectionsUseCase() {
  const repository = new PrismaMarketplaceConnectionsRepository();
  return new ListMarketplaceConnectionsUseCase(repository);
}
