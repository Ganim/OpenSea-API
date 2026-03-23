import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type MarketplaceType =
  | 'MERCADO_LIVRE'
  | 'SHOPEE'
  | 'AMAZON'
  | 'MAGALU'
  | 'TIKTOK_SHOP'
  | 'AMERICANAS'
  | 'ALIEXPRESS'
  | 'CASAS_BAHIA'
  | 'SHEIN'
  | 'CUSTOM';

export type MarketplaceConnectionStatusType =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DISCONNECTED'
  | 'ERROR';

export type MarketplaceFulfillmentTypeValue = 'SELF' | 'MARKETPLACE' | 'HYBRID';

export interface MarketplaceConnectionProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  marketplace: MarketplaceType;
  name: string;
  status: MarketplaceConnectionStatusType;
  sellerId?: string;
  sellerName?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  apiKey?: string;
  apiSecret?: string;
  syncProducts: boolean;
  syncPrices: boolean;
  syncStock: boolean;
  syncOrders: boolean;
  syncMessages: boolean;
  syncIntervalMin: number;
  lastSyncAt?: Date;
  lastSyncStatus?: string;
  lastSyncError?: string;
  priceTableId?: string;
  commissionPercent?: number;
  autoCalcPrice: boolean;
  priceMultiplier: number;
  fulfillmentType: MarketplaceFulfillmentTypeValue;
  defaultWarehouseId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  settings?: Record<string, unknown>;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class MarketplaceConnection extends Entity<MarketplaceConnectionProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get marketplace(): MarketplaceType {
    return this.props.marketplace;
  }
  get name(): string {
    return this.props.name;
  }
  set name(value: string) {
    this.props.name = value;
    this.touch();
  }
  get status(): MarketplaceConnectionStatusType {
    return this.props.status;
  }
  set status(value: MarketplaceConnectionStatusType) {
    this.props.status = value;
    this.touch();
  }
  get sellerId(): string | undefined {
    return this.props.sellerId;
  }
  get sellerName(): string | undefined {
    return this.props.sellerName;
  }
  set sellerName(value: string | undefined) {
    this.props.sellerName = value;
    this.touch();
  }
  get accessToken(): string | undefined {
    return this.props.accessToken;
  }
  set accessToken(value: string | undefined) {
    this.props.accessToken = value;
    this.touch();
  }
  get refreshToken(): string | undefined {
    return this.props.refreshToken;
  }
  set refreshToken(value: string | undefined) {
    this.props.refreshToken = value;
    this.touch();
  }
  get tokenExpiresAt(): Date | undefined {
    return this.props.tokenExpiresAt;
  }
  set tokenExpiresAt(value: Date | undefined) {
    this.props.tokenExpiresAt = value;
    this.touch();
  }
  get apiKey(): string | undefined {
    return this.props.apiKey;
  }
  set apiKey(value: string | undefined) {
    this.props.apiKey = value;
    this.touch();
  }
  get apiSecret(): string | undefined {
    return this.props.apiSecret;
  }
  set apiSecret(value: string | undefined) {
    this.props.apiSecret = value;
    this.touch();
  }
  get syncProducts(): boolean {
    return this.props.syncProducts;
  }
  set syncProducts(value: boolean) {
    this.props.syncProducts = value;
    this.touch();
  }
  get syncPrices(): boolean {
    return this.props.syncPrices;
  }
  set syncPrices(value: boolean) {
    this.props.syncPrices = value;
    this.touch();
  }
  get syncStock(): boolean {
    return this.props.syncStock;
  }
  set syncStock(value: boolean) {
    this.props.syncStock = value;
    this.touch();
  }
  get syncOrders(): boolean {
    return this.props.syncOrders;
  }
  set syncOrders(value: boolean) {
    this.props.syncOrders = value;
    this.touch();
  }
  get syncMessages(): boolean {
    return this.props.syncMessages;
  }
  set syncMessages(value: boolean) {
    this.props.syncMessages = value;
    this.touch();
  }
  get syncIntervalMin(): number {
    return this.props.syncIntervalMin;
  }
  set syncIntervalMin(value: number) {
    this.props.syncIntervalMin = value;
    this.touch();
  }
  get lastSyncAt(): Date | undefined {
    return this.props.lastSyncAt;
  }
  get lastSyncStatus(): string | undefined {
    return this.props.lastSyncStatus;
  }
  get lastSyncError(): string | undefined {
    return this.props.lastSyncError;
  }
  get priceTableId(): string | undefined {
    return this.props.priceTableId;
  }
  set priceTableId(value: string | undefined) {
    this.props.priceTableId = value;
    this.touch();
  }
  get commissionPercent(): number | undefined {
    return this.props.commissionPercent;
  }
  set commissionPercent(value: number | undefined) {
    this.props.commissionPercent = value;
    this.touch();
  }
  get autoCalcPrice(): boolean {
    return this.props.autoCalcPrice;
  }
  set autoCalcPrice(value: boolean) {
    this.props.autoCalcPrice = value;
    this.touch();
  }
  get priceMultiplier(): number {
    return this.props.priceMultiplier;
  }
  set priceMultiplier(value: number) {
    this.props.priceMultiplier = value;
    this.touch();
  }
  get fulfillmentType(): MarketplaceFulfillmentTypeValue {
    return this.props.fulfillmentType;
  }
  set fulfillmentType(value: MarketplaceFulfillmentTypeValue) {
    this.props.fulfillmentType = value;
    this.touch();
  }
  get defaultWarehouseId(): string | undefined {
    return this.props.defaultWarehouseId;
  }
  set defaultWarehouseId(value: string | undefined) {
    this.props.defaultWarehouseId = value;
    this.touch();
  }
  get webhookUrl(): string | undefined {
    return this.props.webhookUrl;
  }
  get webhookSecret(): string | undefined {
    return this.props.webhookSecret;
  }
  get settings(): Record<string, unknown> | undefined {
    return this.props.settings;
  }
  set settings(value: Record<string, unknown> | undefined) {
    this.props.settings = value;
    this.touch();
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
    this.props.status = 'DISCONNECTED';
    this.touch();
  }

  static create(
    props: Optional<
      MarketplaceConnectionProps,
      | 'id'
      | 'status'
      | 'syncProducts'
      | 'syncPrices'
      | 'syncStock'
      | 'syncOrders'
      | 'syncMessages'
      | 'syncIntervalMin'
      | 'autoCalcPrice'
      | 'priceMultiplier'
      | 'fulfillmentType'
      | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): MarketplaceConnection {
    return new MarketplaceConnection(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'ACTIVE',
        syncProducts: props.syncProducts ?? true,
        syncPrices: props.syncPrices ?? true,
        syncStock: props.syncStock ?? true,
        syncOrders: props.syncOrders ?? true,
        syncMessages: props.syncMessages ?? true,
        syncIntervalMin: props.syncIntervalMin ?? 15,
        autoCalcPrice: props.autoCalcPrice ?? false,
        priceMultiplier: props.priceMultiplier ?? 1,
        fulfillmentType: props.fulfillmentType ?? 'SELF',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
