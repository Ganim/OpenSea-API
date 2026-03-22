import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  MarketplaceListing,
  MarketplaceListingStatusType,
} from '@/entities/sales/marketplace-listing';

export interface CreateMarketplaceListingSchema {
  tenantId: string;
  connectionId: string;
  variantId: string;
  parentListingId?: string;
  externalListingId: string;
  externalProductId?: string;
  externalUrl?: string;
  status?: MarketplaceListingStatusType;
  publishedPrice?: number;
  compareAtPrice?: number;
  commissionAmount?: number;
  netPrice?: number;
  publishedStock?: number;
  externalCategoryId?: string;
  externalCategoryPath?: string;
}

export interface MarketplaceListingsRepository {
  create(data: CreateMarketplaceListingSchema): Promise<MarketplaceListing>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceListing | null>;
  findByExternalId(
    connectionId: string,
    externalListingId: string,
  ): Promise<MarketplaceListing | null>;
  findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceListing[]>;
  countByConnection(connectionId: string, tenantId: string): Promise<number>;
  save(listing: MarketplaceListing): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
