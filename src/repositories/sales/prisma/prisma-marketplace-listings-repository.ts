import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplaceListing } from '@/entities/sales/marketplace-listing';
import type { MarketplaceListingStatusType } from '@/entities/sales/marketplace-listing';
import { prisma } from '@/lib/prisma';
import type {
  CreateMarketplaceListingSchema,
  MarketplaceListingsRepository,
} from '../marketplace-listings-repository';
import type { MarketplaceListingStatus as PrismaListingStatus } from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): MarketplaceListing {
  return MarketplaceListing.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      connectionId: new UniqueEntityID(data.connectionId as string),
      variantId: new UniqueEntityID(data.variantId as string),
      parentListingId: data.parentListingId
        ? new UniqueEntityID(data.parentListingId as string)
        : undefined,
      externalListingId: data.externalListingId as string,
      externalProductId: (data.externalProductId as string) ?? undefined,
      externalUrl: (data.externalUrl as string) ?? undefined,
      status: data.status as MarketplaceListingStatusType,
      statusReason: (data.statusReason as string) ?? undefined,
      lastStatusCheck: (data.lastStatusCheck as Date) ?? undefined,
      publishedPrice: data.publishedPrice
        ? Number(data.publishedPrice)
        : undefined,
      compareAtPrice: data.compareAtPrice
        ? Number(data.compareAtPrice)
        : undefined,
      commissionAmount: data.commissionAmount
        ? Number(data.commissionAmount)
        : undefined,
      netPrice: data.netPrice ? Number(data.netPrice) : undefined,
      publishedStock: data.publishedStock as number,
      fulfillmentStock: data.fulfillmentStock as number,
      externalCategoryId: (data.externalCategoryId as string) ?? undefined,
      externalCategoryPath: (data.externalCategoryPath as string) ?? undefined,
      totalSold: data.totalSold as number,
      totalRevenue: Number(data.totalRevenue),
      averageRating: data.averageRating
        ? Number(data.averageRating)
        : undefined,
      reviewCount: data.reviewCount as number,
      buyBoxOwner: data.buyBoxOwner as boolean,
      healthScore: (data.healthScore as number) ?? undefined,
      hasActiveAd: data.hasActiveAd as boolean,
      adSpend: Number(data.adSpend),
      lastSyncAt: (data.lastSyncAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaMarketplaceListingsRepository
  implements MarketplaceListingsRepository
{
  async create(
    data: CreateMarketplaceListingSchema,
  ): Promise<MarketplaceListing> {
    const record = await prisma.marketplaceListing.create({
      data: {
        tenantId: data.tenantId,
        connectionId: data.connectionId,
        variantId: data.variantId,
        parentListingId: data.parentListingId,
        externalListingId: data.externalListingId,
        externalProductId: data.externalProductId,
        externalUrl: data.externalUrl,
        status: (data.status ?? 'DRAFT') as PrismaListingStatus,
        publishedPrice: data.publishedPrice,
        compareAtPrice: data.compareAtPrice,
        commissionAmount: data.commissionAmount,
        netPrice: data.netPrice,
        publishedStock: data.publishedStock ?? 0,
        externalCategoryId: data.externalCategoryId,
        externalCategoryPath: data.externalCategoryPath,
      },
    });

    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceListing | null> {
    const record = await prisma.marketplaceListing.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });
    if (!record) return null;
    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findByExternalId(
    connectionId: string,
    externalListingId: string,
  ): Promise<MarketplaceListing | null> {
    const record = await prisma.marketplaceListing.findFirst({
      where: { connectionId, externalListingId, deletedAt: null },
    });
    if (!record) return null;
    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceListing[]> {
    const records = await prisma.marketplaceListing.findMany({
      where: { connectionId, tenantId, deletedAt: null },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) =>
      mapToDomain(r as unknown as Record<string, unknown>),
    );
  }

  async countByConnection(
    connectionId: string,
    tenantId: string,
  ): Promise<number> {
    return prisma.marketplaceListing.count({
      where: { connectionId, tenantId, deletedAt: null },
    });
  }

  async save(listing: MarketplaceListing): Promise<void> {
    await prisma.marketplaceListing.update({
      where: { id: listing.id.toString() },
      data: {
        status: listing.status as PrismaListingStatus,
        publishedPrice: listing.publishedPrice,
        publishedStock: listing.publishedStock,
        deletedAt: listing.deletedAt,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.marketplaceListing.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }
}
