import { PrismaMarketplaceListingsRepository } from '@/repositories/sales/prisma/prisma-marketplace-listings-repository';
import { ListMarketplaceListingsUseCase } from '../list-marketplace-listings';

export function makeListMarketplaceListingsUseCase() {
  const repository = new PrismaMarketplaceListingsRepository();
  return new ListMarketplaceListingsUseCase(repository);
}
