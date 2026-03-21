import { PrismaMarketplaceListingsRepository } from '@/repositories/sales/prisma/prisma-marketplace-listings-repository';
import { DeactivateMarketplaceListingUseCase } from '../deactivate-marketplace-listing';

export function makeDeactivateMarketplaceListingUseCase() {
  const repository = new PrismaMarketplaceListingsRepository();
  return new DeactivateMarketplaceListingUseCase(repository);
}
