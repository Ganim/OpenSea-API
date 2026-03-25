import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceType } from '@/entities/sales/marketplace-connection';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';
import type { MarketplaceListingsRepository } from '@/repositories/sales/marketplace-listings-repository';
import type {
  MarketplaceAdapter,
  OAuthTokens,
} from '@/services/marketplace/marketplace-adapter.interface';

interface InventoryItem {
  variantId: string;
  availableQuantity: number;
}

interface SyncInventoryToMarketplaceUseCaseRequest {
  tenantId: string;
  connectionId: string;
  inventoryItems: InventoryItem[];
}

interface SyncInventoryToMarketplaceUseCaseResponse {
  updatedCount: number;
  failedCount: number;
  errors: Array<{ externalListingId: string; message: string }>;
}

export class SyncInventoryToMarketplaceUseCase {
  constructor(
    private readonly connectionsRepository: MarketplaceConnectionsRepository,
    private readonly listingsRepository: MarketplaceListingsRepository,
    private readonly adapterResolver: (
      platform: MarketplaceType,
    ) => MarketplaceAdapter,
  ) {}

  async execute(
    input: SyncInventoryToMarketplaceUseCaseRequest,
  ): Promise<SyncInventoryToMarketplaceUseCaseResponse> {
    if (!input.inventoryItems || input.inventoryItems.length === 0) {
      throw new BadRequestError(
        'At least one inventory item is required for synchronization.',
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
        'Marketplace connection must be active to sync inventory.',
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

    let updatedCount = 0;
    const syncErrors: Array<{
      externalListingId: string;
      message: string;
    }> = [];

    for (const inventoryItem of input.inventoryItems) {
      const existingListing = await this.listingsRepository.findByExternalId(
        input.connectionId,
        inventoryItem.variantId,
      );

      if (!existingListing) {
        continue;
      }

      try {
        await adapter.updateStock(
          tokens,
          existingListing.externalListingId,
          inventoryItem.availableQuantity,
        );

        existingListing.publishedStock = inventoryItem.availableQuantity;

        if (inventoryItem.availableQuantity === 0) {
          existingListing.status = 'OUT_OF_STOCK';
        } else if (existingListing.status === 'OUT_OF_STOCK') {
          existingListing.status = 'ACTIVE';
        }

        await this.listingsRepository.save(existingListing);
        updatedCount++;
      } catch (updateError) {
        const errorMessage =
          updateError instanceof Error
            ? updateError.message
            : 'Unknown stock update error';
        syncErrors.push({
          externalListingId: existingListing.externalListingId,
          message: errorMessage,
        });
      }
    }

    return {
      updatedCount,
      failedCount: syncErrors.length,
      errors: syncErrors,
    };
  }
}
