import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { DeleteMarketplaceConnectionUseCase } from '../delete-marketplace-connection';

export function makeDeleteMarketplaceConnectionUseCase() {
  const repository = new PrismaMarketplaceConnectionsRepository();
  return new DeleteMarketplaceConnectionUseCase(repository);
}
