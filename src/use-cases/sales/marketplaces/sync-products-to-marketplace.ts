import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceType } from '@/entities/sales/marketplace-connection';
import type { MarketplaceListingDTO } from '@/mappers/sales/marketplace/marketplace-listing-to-dto';
import { marketplaceListingToDTO } from '@/mappers/sales/marketplace/marketplace-listing-to-dto';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';
import type { MarketplaceListingsRepository } from '@/repositories/sales/marketplace-listings-repository';
import type {
  MarketplaceAdapter,
  MarketplaceProduct,
  OAuthTokens,
} from '@/services/marketplace/marketplace-adapter.interface';

interface ProductToSync {
  variantId: string;
  title: string;
  description: string;
  price: number;
  currency?: string;
  quantity: number;
  categoryId: string;
  images: string[];
  sku?: string;
  gtin?: string;
  attributes?: Record<string, string>;
}

interface SyncProductsToMarketplaceUseCaseRequest {
  tenantId: string;
  connectionId: string;
  products: ProductToSync[];
}

interface SyncProductsToMarketplaceUseCaseResponse {
  syncedListings: MarketplaceListingDTO[];
  failedCount: number;
  errors: Array<{ variantId: string; message: string }>;
}

export class SyncProductsToMarketplaceUseCase {
  constructor(
    private readonly connectionsRepository: MarketplaceConnectionsRepository,
    private readonly listingsRepository: MarketplaceListingsRepository,
    private readonly adapterResolver: (
      platform: MarketplaceType,
    ) => MarketplaceAdapter,
  ) {}

  async execute(
    input: SyncProductsToMarketplaceUseCaseRequest,
  ): Promise<SyncProductsToMarketplaceUseCaseResponse> {
    if (!input.products || input.products.length === 0) {
      throw new BadRequestError(
        'At least one product is required for synchronization.',
      );
    }

    const connection = await this.connectionsRepository.findById(
      new UniqueEntityID(input.connectionId),
      input.tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError('Marketplace connection not found.');
    }

    if (connection.status !== 'ACTIVE') {
      throw new BadRequestError(
        'Marketplace connection must be active to sync products.',
      );
    }

    if (!connection.accessToken) {
      throw new BadRequestError(
        'Marketplace connection has no access token. Please reconnect.',
      );
    }

    const adapter = this.adapterResolver(connection.marketplace);

    const tokens: OAuthTokens = {
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken ?? '',
      expiresAt: connection.tokenExpiresAt ?? new Date(),
      userId: connection.sellerId,
    };

    const syncedListings: MarketplaceListingDTO[] = [];
    const syncErrors: Array<{ variantId: string; message: string }> = [];

    for (const productData of input.products) {
      try {
        const marketplaceProduct: MarketplaceProduct = {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          currency: productData.currency ?? 'BRL',
          quantity: productData.quantity,
          categoryId: productData.categoryId,
          images: productData.images,
          sku: productData.sku,
          gtin: productData.gtin,
          attributes: productData.attributes,
        };

        const existingListing = await this.listingsRepository.findByExternalId(
          input.connectionId,
          productData.variantId,
        );

        if (existingListing) {
          await adapter.updateListing(
            tokens,
            existingListing.externalListingId,
            marketplaceProduct,
          );

          existingListing.publishedPrice = productData.price;
          existingListing.publishedStock = productData.quantity;
          existingListing.status = 'ACTIVE';

          await this.listingsRepository.save(existingListing);
          syncedListings.push(marketplaceListingToDTO(existingListing));
        } else {
          const listingResult = await adapter.createListing(
            tokens,
            marketplaceProduct,
          );

          const newListing = await this.listingsRepository.create({
            tenantId: input.tenantId,
            connectionId: input.connectionId,
            variantId: productData.variantId,
            externalListingId: listingResult.externalId,
            externalUrl: listingResult.permalink,
            status: 'ACTIVE',
            publishedPrice: productData.price,
            publishedStock: productData.quantity,
          });

          syncedListings.push(marketplaceListingToDTO(newListing));
        }
      } catch (syncError) {
        const errorMessage =
          syncError instanceof Error ? syncError.message : 'Unknown sync error';
        syncErrors.push({
          variantId: productData.variantId,
          message: errorMessage,
        });
      }
    }

    return {
      syncedListings,
      failedCount: syncErrors.length,
      errors: syncErrors,
    };
  }
}
