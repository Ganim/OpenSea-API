import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceListingsRepository } from '@/repositories/sales/marketplace-listings-repository';

interface DeactivateMarketplaceListingUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeactivateMarketplaceListingUseCaseResponse {
  message: string;
}

export class DeactivateMarketplaceListingUseCase {
  constructor(private listingsRepository: MarketplaceListingsRepository) {}

  async execute(
    input: DeactivateMarketplaceListingUseCaseRequest,
  ): Promise<DeactivateMarketplaceListingUseCaseResponse> {
    const listing = await this.listingsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!listing) {
      throw new ResourceNotFoundError('Listing not found.');
    }

    listing.status = 'PAUSED';
    await this.listingsRepository.save(listing);

    return { message: 'Listing deactivated successfully.' };
  }
}
