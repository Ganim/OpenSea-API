import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  MarketplaceConnection,
  MarketplaceConnectionStatusType,
  MarketplaceType,
} from '@/entities/sales/marketplace-connection';

export interface CreateMarketplaceConnectionSchema {
  tenantId: string;
  marketplace: MarketplaceType;
  name: string;
  status?: MarketplaceConnectionStatusType;
  sellerId?: string;
  sellerName?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  apiKey?: string;
  apiSecret?: string;
  syncProducts?: boolean;
  syncPrices?: boolean;
  syncStock?: boolean;
  syncOrders?: boolean;
  syncMessages?: boolean;
  syncIntervalMin?: number;
  priceTableId?: string;
  commissionPercent?: number;
  autoCalcPrice?: boolean;
  priceMultiplier?: number;
  fulfillmentType?: 'SELF' | 'MARKETPLACE' | 'HYBRID';
  defaultWarehouseId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateMarketplaceConnectionSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  status?: MarketplaceConnectionStatusType;
  sellerId?: string;
  sellerName?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  apiKey?: string;
  apiSecret?: string;
  syncProducts?: boolean;
  syncPrices?: boolean;
  syncStock?: boolean;
  syncOrders?: boolean;
  syncMessages?: boolean;
  syncIntervalMin?: number;
  priceTableId?: string;
  commissionPercent?: number;
  autoCalcPrice?: boolean;
  priceMultiplier?: number;
  fulfillmentType?: 'SELF' | 'MARKETPLACE' | 'HYBRID';
  defaultWarehouseId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  settings?: Record<string, unknown>;
}

export interface MarketplaceConnectionsRepository {
  create(
    data: CreateMarketplaceConnectionSchema,
  ): Promise<MarketplaceConnection>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceConnection | null>;
  findByMarketplaceAndSeller(
    marketplace: MarketplaceType,
    sellerId: string,
    tenantId: string,
  ): Promise<MarketplaceConnection | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceConnection[]>;
  countByTenant(tenantId: string): Promise<number>;
  update(
    data: UpdateMarketplaceConnectionSchema,
  ): Promise<MarketplaceConnection | null>;
  save(connection: MarketplaceConnection): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
