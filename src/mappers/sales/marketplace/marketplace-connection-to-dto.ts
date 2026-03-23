import type { MarketplaceConnection } from '@/entities/sales/marketplace-connection';

export interface MarketplaceConnectionDTO {
  id: string;
  marketplace: string;
  name: string;
  status: string;
  sellerId?: string;
  sellerName?: string;
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
  fulfillmentType: string;
  defaultWarehouseId?: string;
  webhookUrl?: string;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt?: Date;
}

export function marketplaceConnectionToDTO(
  connection: MarketplaceConnection,
): MarketplaceConnectionDTO {
  const dto: MarketplaceConnectionDTO = {
    id: connection.id.toString(),
    marketplace: connection.marketplace,
    name: connection.name,
    status: connection.status,
    syncProducts: connection.syncProducts,
    syncPrices: connection.syncPrices,
    syncStock: connection.syncStock,
    syncOrders: connection.syncOrders,
    syncMessages: connection.syncMessages,
    syncIntervalMin: connection.syncIntervalMin,
    autoCalcPrice: connection.autoCalcPrice,
    priceMultiplier: connection.priceMultiplier,
    fulfillmentType: connection.fulfillmentType,
    createdAt: connection.createdAt,
  };
  if (connection.sellerId) dto.sellerId = connection.sellerId;
  if (connection.sellerName) dto.sellerName = connection.sellerName;
  if (connection.lastSyncAt) dto.lastSyncAt = connection.lastSyncAt;
  if (connection.lastSyncStatus) dto.lastSyncStatus = connection.lastSyncStatus;
  if (connection.lastSyncError) dto.lastSyncError = connection.lastSyncError;
  if (connection.priceTableId) dto.priceTableId = connection.priceTableId;
  if (connection.commissionPercent !== undefined)
    dto.commissionPercent = connection.commissionPercent;
  if (connection.defaultWarehouseId)
    dto.defaultWarehouseId = connection.defaultWarehouseId;
  if (connection.webhookUrl) dto.webhookUrl = connection.webhookUrl;
  if (connection.settings) dto.settings = connection.settings;
  if (connection.updatedAt) dto.updatedAt = connection.updatedAt;
  return dto;
}
