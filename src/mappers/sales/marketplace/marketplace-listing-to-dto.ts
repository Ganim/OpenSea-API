import type { MarketplaceListing } from '@/entities/sales/marketplace-listing';

export interface MarketplaceListingDTO {
  id: string;
  connectionId: string;
  variantId: string;
  parentListingId?: string;
  externalListingId: string;
  externalProductId?: string;
  externalUrl?: string;
  status: string;
  statusReason?: string;
  publishedPrice?: number;
  compareAtPrice?: number;
  commissionAmount?: number;
  netPrice?: number;
  publishedStock: number;
  fulfillmentStock: number;
  externalCategoryId?: string;
  externalCategoryPath?: string;
  totalSold: number;
  totalRevenue: number;
  averageRating?: number;
  reviewCount: number;
  buyBoxOwner: boolean;
  healthScore?: number;
  hasActiveAd: boolean;
  adSpend: number;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export function marketplaceListingToDTO(listing: MarketplaceListing): MarketplaceListingDTO {
  return {
    id: listing.id.toString(),
    connectionId: listing.connectionId.toString(),
    variantId: listing.variantId.toString(),
    parentListingId: listing.parentListingId?.toString(),
    externalListingId: listing.externalListingId,
    externalProductId: listing.externalProductId,
    externalUrl: listing.externalUrl,
    status: listing.status,
    statusReason: listing.statusReason,
    publishedPrice: listing.publishedPrice,
    compareAtPrice: listing.compareAtPrice,
    commissionAmount: listing.commissionAmount,
    netPrice: listing.netPrice,
    publishedStock: listing.publishedStock,
    fulfillmentStock: listing.fulfillmentStock,
    externalCategoryId: listing.externalCategoryId,
    externalCategoryPath: listing.externalCategoryPath,
    totalSold: listing.totalSold,
    totalRevenue: listing.totalRevenue,
    averageRating: listing.averageRating,
    reviewCount: listing.reviewCount,
    buyBoxOwner: listing.buyBoxOwner,
    healthScore: listing.healthScore,
    hasActiveAd: listing.hasActiveAd,
    adSpend: listing.adSpend,
    lastSyncAt: listing.lastSyncAt,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
}
