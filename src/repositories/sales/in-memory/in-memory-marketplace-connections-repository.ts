import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplaceConnection } from '@/entities/sales/marketplace-connection';
import type {
  CreateMarketplaceConnectionSchema,
  MarketplaceConnectionsRepository,
  UpdateMarketplaceConnectionSchema,
} from '../marketplace-connections-repository';
import type { MarketplaceType } from '@/entities/sales/marketplace-connection';

export class InMemoryMarketplaceConnectionsRepository
  implements MarketplaceConnectionsRepository
{
  public items: MarketplaceConnection[] = [];

  async create(
    data: CreateMarketplaceConnectionSchema,
  ): Promise<MarketplaceConnection> {
    const connection = MarketplaceConnection.create({
      tenantId: new UniqueEntityID(data.tenantId),
      marketplace: data.marketplace,
      name: data.name,
      status: data.status,
      sellerId: data.sellerId,
      sellerName: data.sellerName,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      syncProducts: data.syncProducts,
      syncPrices: data.syncPrices,
      syncStock: data.syncStock,
      syncOrders: data.syncOrders,
      syncMessages: data.syncMessages,
      syncIntervalMin: data.syncIntervalMin,
      priceTableId: data.priceTableId,
      commissionPercent: data.commissionPercent,
      autoCalcPrice: data.autoCalcPrice,
      priceMultiplier: data.priceMultiplier,
      fulfillmentType: data.fulfillmentType,
      defaultWarehouseId: data.defaultWarehouseId,
      webhookUrl: data.webhookUrl,
      webhookSecret: data.webhookSecret,
      settings: data.settings,
    });

    this.items.push(connection);
    return connection;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceConnection | null> {
    const item = this.items.find(
      (c) =>
        !c.deletedAt && c.id.equals(id) && c.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByMarketplaceAndSeller(
    marketplace: MarketplaceType,
    sellerId: string,
    tenantId: string,
  ): Promise<MarketplaceConnection | null> {
    const item = this.items.find(
      (c) =>
        !c.deletedAt &&
        c.marketplace === marketplace &&
        c.sellerId === sellerId &&
        c.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceConnection[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter((c) => !c.deletedAt && c.tenantId.toString() === tenantId)
      .slice(start, start + perPage);
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.items.filter(
      (c) => !c.deletedAt && c.tenantId.toString() === tenantId,
    ).length;
  }

  async update(
    data: UpdateMarketplaceConnectionSchema,
  ): Promise<MarketplaceConnection | null> {
    const index = this.items.findIndex((c) => c.id.equals(data.id));
    if (index === -1) return null;

    const connection = this.items[index];
    if (data.name !== undefined) connection.name = data.name;
    if (data.status !== undefined) connection.status = data.status;
    if (data.sellerName !== undefined) connection.sellerName = data.sellerName;
    if (data.accessToken !== undefined)
      connection.accessToken = data.accessToken;
    if (data.refreshToken !== undefined)
      connection.refreshToken = data.refreshToken;
    if (data.tokenExpiresAt !== undefined)
      connection.tokenExpiresAt = data.tokenExpiresAt;
    if (data.apiKey !== undefined) connection.apiKey = data.apiKey;
    if (data.apiSecret !== undefined) connection.apiSecret = data.apiSecret;
    if (data.syncProducts !== undefined)
      connection.syncProducts = data.syncProducts;
    if (data.syncPrices !== undefined) connection.syncPrices = data.syncPrices;
    if (data.syncStock !== undefined) connection.syncStock = data.syncStock;
    if (data.syncOrders !== undefined) connection.syncOrders = data.syncOrders;
    if (data.syncMessages !== undefined)
      connection.syncMessages = data.syncMessages;
    if (data.syncIntervalMin !== undefined)
      connection.syncIntervalMin = data.syncIntervalMin;
    if (data.priceTableId !== undefined)
      connection.priceTableId = data.priceTableId;
    if (data.commissionPercent !== undefined)
      connection.commissionPercent = data.commissionPercent;
    if (data.autoCalcPrice !== undefined)
      connection.autoCalcPrice = data.autoCalcPrice;
    if (data.priceMultiplier !== undefined)
      connection.priceMultiplier = data.priceMultiplier;
    if (data.fulfillmentType !== undefined)
      connection.fulfillmentType = data.fulfillmentType;
    if (data.defaultWarehouseId !== undefined)
      connection.defaultWarehouseId = data.defaultWarehouseId;
    if (data.settings !== undefined) connection.settings = data.settings;

    return connection;
  }

  async save(connection: MarketplaceConnection): Promise<void> {
    const index = this.items.findIndex((c) => c.id.equals(connection.id));
    if (index >= 0) {
      this.items[index] = connection;
    } else {
      this.items.push(connection);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const connection = this.items.find((c) => !c.deletedAt && c.id.equals(id));
    if (connection) {
      connection.delete();
    }
  }
}
