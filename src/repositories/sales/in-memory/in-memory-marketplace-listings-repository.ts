import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplaceListing } from '@/entities/sales/marketplace-listing';
import type {
  CreateMarketplaceListingSchema,
  MarketplaceListingsRepository,
} from '../marketplace-listings-repository';

export class InMemoryMarketplaceListingsRepository
  implements MarketplaceListingsRepository
{
  public items: MarketplaceListing[] = [];

  async create(
    data: CreateMarketplaceListingSchema,
  ): Promise<MarketplaceListing> {
    const listing = MarketplaceListing.create({
      tenantId: new UniqueEntityID(data.tenantId),
      connectionId: new UniqueEntityID(data.connectionId),
      variantId: new UniqueEntityID(data.variantId),
      parentListingId: data.parentListingId
        ? new UniqueEntityID(data.parentListingId)
        : undefined,
      externalListingId: data.externalListingId,
      externalProductId: data.externalProductId,
      externalUrl: data.externalUrl,
      status: data.status,
      publishedPrice: data.publishedPrice,
      compareAtPrice: data.compareAtPrice,
      commissionAmount: data.commissionAmount,
      netPrice: data.netPrice,
      publishedStock: data.publishedStock,
      externalCategoryId: data.externalCategoryId,
      externalCategoryPath: data.externalCategoryPath,
    });

    this.items.push(listing);
    return listing;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceListing | null> {
    const item = this.items.find(
      (l) =>
        !l.deletedAt && l.id.equals(id) && l.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByExternalId(
    connectionId: string,
    externalListingId: string,
  ): Promise<MarketplaceListing | null> {
    const item = this.items.find(
      (l) =>
        !l.deletedAt &&
        l.connectionId.toString() === connectionId &&
        l.externalListingId === externalListingId,
    );
    return item ?? null;
  }

  async findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceListing[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (l) =>
          !l.deletedAt &&
          l.connectionId.toString() === connectionId &&
          l.tenantId.toString() === tenantId,
      )
      .slice(start, start + perPage);
  }

  async countByConnection(
    connectionId: string,
    tenantId: string,
  ): Promise<number> {
    return this.items.filter(
      (l) =>
        !l.deletedAt &&
        l.connectionId.toString() === connectionId &&
        l.tenantId.toString() === tenantId,
    ).length;
  }

  async save(listing: MarketplaceListing): Promise<void> {
    const index = this.items.findIndex((l) => l.id.equals(listing.id));
    if (index >= 0) {
      this.items[index] = listing;
    } else {
      this.items.push(listing);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const listing = this.items.find((l) => !l.deletedAt && l.id.equals(id));
    if (listing) {
      listing.delete();
    }
  }
}
