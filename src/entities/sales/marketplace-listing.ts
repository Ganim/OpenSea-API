import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type MarketplaceListingStatusType =
  | 'DRAFT'
  | 'PENDING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ERROR'
  | 'OUT_OF_STOCK'
  | 'BLOCKED'
  | 'DELETED';

export interface MarketplaceListingProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  connectionId: UniqueEntityID;
  variantId: UniqueEntityID;
  parentListingId?: UniqueEntityID;
  externalListingId: string;
  externalProductId?: string;
  externalUrl?: string;
  status: MarketplaceListingStatusType;
  statusReason?: string;
  lastStatusCheck?: Date;
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
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class MarketplaceListing extends Entity<MarketplaceListingProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get connectionId(): UniqueEntityID {
    return this.props.connectionId;
  }
  get variantId(): UniqueEntityID {
    return this.props.variantId;
  }
  get parentListingId(): UniqueEntityID | undefined {
    return this.props.parentListingId;
  }
  get externalListingId(): string {
    return this.props.externalListingId;
  }
  get externalProductId(): string | undefined {
    return this.props.externalProductId;
  }
  get externalUrl(): string | undefined {
    return this.props.externalUrl;
  }
  get status(): MarketplaceListingStatusType {
    return this.props.status;
  }
  set status(value: MarketplaceListingStatusType) {
    this.props.status = value;
    this.touch();
  }
  get statusReason(): string | undefined {
    return this.props.statusReason;
  }
  get lastStatusCheck(): Date | undefined {
    return this.props.lastStatusCheck;
  }
  get publishedPrice(): number | undefined {
    return this.props.publishedPrice;
  }
  set publishedPrice(value: number | undefined) {
    this.props.publishedPrice = value;
    this.touch();
  }
  get compareAtPrice(): number | undefined {
    return this.props.compareAtPrice;
  }
  get commissionAmount(): number | undefined {
    return this.props.commissionAmount;
  }
  get netPrice(): number | undefined {
    return this.props.netPrice;
  }
  get publishedStock(): number {
    return this.props.publishedStock;
  }
  set publishedStock(value: number) {
    this.props.publishedStock = value;
    this.touch();
  }
  get fulfillmentStock(): number {
    return this.props.fulfillmentStock;
  }
  get externalCategoryId(): string | undefined {
    return this.props.externalCategoryId;
  }
  get externalCategoryPath(): string | undefined {
    return this.props.externalCategoryPath;
  }
  get totalSold(): number {
    return this.props.totalSold;
  }
  get totalRevenue(): number {
    return this.props.totalRevenue;
  }
  get averageRating(): number | undefined {
    return this.props.averageRating;
  }
  get reviewCount(): number {
    return this.props.reviewCount;
  }
  get buyBoxOwner(): boolean {
    return this.props.buyBoxOwner;
  }
  get healthScore(): number | undefined {
    return this.props.healthScore;
  }
  get hasActiveAd(): boolean {
    return this.props.hasActiveAd;
  }
  get adSpend(): number {
    return this.props.adSpend;
  }
  get lastSyncAt(): Date | undefined {
    return this.props.lastSyncAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }
  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.status = 'DELETED';
    this.touch();
  }

  static create(
    props: Optional<
      MarketplaceListingProps,
      | 'id'
      | 'status'
      | 'publishedStock'
      | 'fulfillmentStock'
      | 'totalSold'
      | 'totalRevenue'
      | 'reviewCount'
      | 'buyBoxOwner'
      | 'hasActiveAd'
      | 'adSpend'
      | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): MarketplaceListing {
    return new MarketplaceListing(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'DRAFT',
        publishedStock: props.publishedStock ?? 0,
        fulfillmentStock: props.fulfillmentStock ?? 0,
        totalSold: props.totalSold ?? 0,
        totalRevenue: props.totalRevenue ?? 0,
        reviewCount: props.reviewCount ?? 0,
        buyBoxOwner: props.buyBoxOwner ?? false,
        hasActiveAd: props.hasActiveAd ?? false,
        adSpend: props.adSpend ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
