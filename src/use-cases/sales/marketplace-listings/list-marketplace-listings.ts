import type { MarketplaceListingDTO } from '@/mappers/sales/marketplace/marketplace-listing-to-dto';
import { marketplaceListingToDTO } from '@/mappers/sales/marketplace/marketplace-listing-to-dto';
import type { MarketplaceListingsRepository } from '@/repositories/sales/marketplace-listings-repository';

interface ListMarketplaceListingsUseCaseRequest {
  tenantId: string;
  connectionId: string;
  page?: number;
  perPage?: number;
}

interface ListMarketplaceListingsUseCaseResponse {
  listings: MarketplaceListingDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListMarketplaceListingsUseCase {
  constructor(private listingsRepository: MarketplaceListingsRepository) {}

  async execute(
    input: ListMarketplaceListingsUseCaseRequest,
  ): Promise<ListMarketplaceListingsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [listings, total] = await Promise.all([
      this.listingsRepository.findManyByConnection(
        input.connectionId,
        page,
        perPage,
        input.tenantId,
      ),
      this.listingsRepository.countByConnection(
        input.connectionId,
        input.tenantId,
      ),
    ]);

    return {
      listings: listings.map(marketplaceListingToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
