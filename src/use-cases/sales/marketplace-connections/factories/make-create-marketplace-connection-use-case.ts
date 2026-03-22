import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { CreateMarketplaceConnectionUseCase } from '../create-marketplace-connection';

export function makeCreateMarketplaceConnectionUseCase() {
  const repository = new PrismaMarketplaceConnectionsRepository();
  return new CreateMarketplaceConnectionUseCase(repository);
}
