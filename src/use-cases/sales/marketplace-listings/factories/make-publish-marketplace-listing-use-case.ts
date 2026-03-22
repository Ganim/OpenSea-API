import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import { PrismaMarketplaceListingsRepository } from '@/repositories/sales/prisma/prisma-marketplace-listings-repository';
import { PublishMarketplaceListingUseCase } from '../publish-marketplace-listing';

export function makePublishMarketplaceListingUseCase() {
  const connectionsRepository = new PrismaMarketplaceConnectionsRepository();
  const listingsRepository = new PrismaMarketplaceListingsRepository();
  return new PublishMarketplaceListingUseCase(
    connectionsRepository,
    listingsRepository,
  );
}
