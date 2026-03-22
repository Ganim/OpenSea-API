import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceListingDTO } from '@/mappers/sales/marketplace/marketplace-listing-to-dto';
import { marketplaceListingToDTO } from '@/mappers/sales/marketplace/marketplace-listing-to-dto';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';
import type { MarketplaceListingsRepository } from '@/repositories/sales/marketplace-listings-repository';

interface PublishMarketplaceListingUseCaseRequest {
  tenantId: string;
  connectionId: string;
  variantId: string;
  externalListingId: string;
  externalProductId?: string;
  externalUrl?: string;
  publishedPrice?: number;
  compareAtPrice?: number;
  publishedStock?: number;
  externalCategoryId?: string;
  externalCategoryPath?: string;
}

interface PublishMarketplaceListingUseCaseResponse {
  listing: MarketplaceListingDTO;
}

export class PublishMarketplaceListingUseCase {
  constructor(
    private connectionsRepository: MarketplaceConnectionsRepository,
    private listingsRepository: MarketplaceListingsRepository,
  ) {}

  async execute(
    input: PublishMarketplaceListingUseCaseRequest,
  ): Promise<PublishMarketplaceListingUseCaseResponse> {
    const connection = await this.connectionsRepository.findById(
      new UniqueEntityID(input.connectionId),
      input.tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError('Connection not found.');
    }

    if (connection.status !== 'ACTIVE') {
      throw new BadRequestError('Connection is not active.');
    }

    if (
      !input.externalListingId ||
      input.externalListingId.trim().length === 0
    ) {
      throw new BadRequestError('External listing ID is required.');
    }

    const existingListing = await this.listingsRepository.findByExternalId(
      input.connectionId,
      input.externalListingId,
    );

    if (existingListing) {
      throw new BadRequestError(
        'A listing with this external ID already exists for this connection.',
      );
    }

    // Calculate commission if auto-calc is enabled
    let commissionAmount: number | undefined;
    let netPrice: number | undefined;

    if (input.publishedPrice && connection.commissionPercent) {
      commissionAmount =
        (input.publishedPrice * connection.commissionPercent) / 100;
      netPrice = input.publishedPrice - commissionAmount;
    }

    const listing = await this.listingsRepository.create({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      variantId: input.variantId,
      externalListingId: input.externalListingId.trim(),
      externalProductId: input.externalProductId,
      externalUrl: input.externalUrl,
      status: 'PENDING',
      publishedPrice: input.publishedPrice,
      compareAtPrice: input.compareAtPrice,
      commissionAmount,
      netPrice,
      publishedStock: input.publishedStock,
      externalCategoryId: input.externalCategoryId,
      externalCategoryPath: input.externalCategoryPath,
    });

    return { listing: marketplaceListingToDTO(listing) };
  }
}
