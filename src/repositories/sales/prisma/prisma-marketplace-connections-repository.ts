import type { Prisma } from '@prisma/generated/client.js';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplaceConnection } from '@/entities/sales/marketplace-connection';
import type {
  MarketplaceType,
  MarketplaceConnectionStatusType,
  MarketplaceFulfillmentTypeValue,
} from '@/entities/sales/marketplace-connection';
import { prisma } from '@/lib/prisma';
import type {
  CreateMarketplaceConnectionSchema,
  MarketplaceConnectionsRepository,
  UpdateMarketplaceConnectionSchema,
} from '../marketplace-connections-repository';
import type {
  MarketplaceType as PrismaMarketplaceType,
  MarketplaceConnectionStatus as PrismaConnectionStatus,
  MarketplaceFulfillmentType as PrismaFulfillmentType,
} from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): MarketplaceConnection {
  return MarketplaceConnection.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      marketplace: data.marketplace as MarketplaceType,
      name: data.name as string,
      status: data.status as MarketplaceConnectionStatusType,
      sellerId: (data.sellerId as string) ?? undefined,
      sellerName: (data.sellerName as string) ?? undefined,
      accessToken: (data.accessToken as string) ?? undefined,
      refreshToken: (data.refreshToken as string) ?? undefined,
      tokenExpiresAt: (data.tokenExpiresAt as Date) ?? undefined,
      apiKey: (data.apiKey as string) ?? undefined,
      apiSecret: (data.apiSecret as string) ?? undefined,
      syncProducts: data.syncProducts as boolean,
      syncPrices: data.syncPrices as boolean,
      syncStock: data.syncStock as boolean,
      syncOrders: data.syncOrders as boolean,
      syncMessages: data.syncMessages as boolean,
      syncIntervalMin: data.syncIntervalMin as number,
      lastSyncAt: (data.lastSyncAt as Date) ?? undefined,
      lastSyncStatus: (data.lastSyncStatus as string) ?? undefined,
      lastSyncError: (data.lastSyncError as string) ?? undefined,
      priceTableId: (data.priceTableId as string) ?? undefined,
      commissionPercent: data.commissionPercent
        ? Number(data.commissionPercent)
        : undefined,
      autoCalcPrice: data.autoCalcPrice as boolean,
      priceMultiplier: Number(data.priceMultiplier),
      fulfillmentType: data.fulfillmentType as MarketplaceFulfillmentTypeValue,
      defaultWarehouseId: (data.defaultWarehouseId as string) ?? undefined,
      webhookUrl: (data.webhookUrl as string) ?? undefined,
      webhookSecret: (data.webhookSecret as string) ?? undefined,
      settings: (data.settings as Record<string, unknown>) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaMarketplaceConnectionsRepository
  implements MarketplaceConnectionsRepository
{
  async create(
    data: CreateMarketplaceConnectionSchema,
  ): Promise<MarketplaceConnection> {
    const record = await prisma.marketplaceConnection.create({
      data: {
        tenantId: data.tenantId,
        marketplace: data.marketplace as PrismaMarketplaceType,
        name: data.name,
        status: (data.status ?? 'ACTIVE') as PrismaConnectionStatus,
        sellerId: data.sellerId,
        sellerName: data.sellerName,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        syncProducts: data.syncProducts ?? true,
        syncPrices: data.syncPrices ?? true,
        syncStock: data.syncStock ?? true,
        syncOrders: data.syncOrders ?? true,
        syncMessages: data.syncMessages ?? false,
        syncIntervalMin: data.syncIntervalMin ?? 15,
        priceTableId: data.priceTableId,
        commissionPercent: data.commissionPercent,
        autoCalcPrice: data.autoCalcPrice ?? false,
        priceMultiplier: data.priceMultiplier ?? 1,
        fulfillmentType: (data.fulfillmentType ??
          'SELF') as PrismaFulfillmentType,
        defaultWarehouseId: data.defaultWarehouseId,
        webhookUrl: data.webhookUrl,
        webhookSecret: data.webhookSecret,
        settings: (data.settings ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceConnection | null> {
    const record = await prisma.marketplaceConnection.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });
    if (!record) return null;
    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findByMarketplaceAndSeller(
    marketplace: MarketplaceType,
    sellerId: string,
    tenantId: string,
  ): Promise<MarketplaceConnection | null> {
    const record = await prisma.marketplaceConnection.findFirst({
      where: {
        marketplace: marketplace as PrismaMarketplaceType,
        sellerId,
        tenantId,
        deletedAt: null,
      },
    });
    if (!record) return null;
    return mapToDomain(record as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceConnection[]> {
    const records = await prisma.marketplaceConnection.findMany({
      where: { tenantId, deletedAt: null },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) =>
      mapToDomain(r as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.marketplaceConnection.count({
      where: { tenantId, deletedAt: null },
    });
  }

  async update(
    data: UpdateMarketplaceConnectionSchema,
  ): Promise<MarketplaceConnection | null> {
    try {
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.sellerId !== undefined) updateData.sellerId = data.sellerId;
      if (data.sellerName !== undefined) updateData.sellerName = data.sellerName;
      if (data.accessToken !== undefined)
        updateData.accessToken = data.accessToken;
      if (data.refreshToken !== undefined)
        updateData.refreshToken = data.refreshToken;
      if (data.tokenExpiresAt !== undefined)
        updateData.tokenExpiresAt = data.tokenExpiresAt;
      if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
      if (data.apiSecret !== undefined) updateData.apiSecret = data.apiSecret;
      if (data.syncProducts !== undefined)
        updateData.syncProducts = data.syncProducts;
      if (data.syncPrices !== undefined)
        updateData.syncPrices = data.syncPrices;
      if (data.syncStock !== undefined) updateData.syncStock = data.syncStock;
      if (data.syncOrders !== undefined)
        updateData.syncOrders = data.syncOrders;
      if (data.syncMessages !== undefined)
        updateData.syncMessages = data.syncMessages;
      if (data.syncIntervalMin !== undefined)
        updateData.syncIntervalMin = data.syncIntervalMin;
      if (data.priceTableId !== undefined)
        updateData.priceTableId = data.priceTableId;
      if (data.commissionPercent !== undefined)
        updateData.commissionPercent = data.commissionPercent;
      if (data.autoCalcPrice !== undefined)
        updateData.autoCalcPrice = data.autoCalcPrice;
      if (data.priceMultiplier !== undefined)
        updateData.priceMultiplier = data.priceMultiplier;
      if (data.fulfillmentType !== undefined)
        updateData.fulfillmentType = data.fulfillmentType;
      if (data.defaultWarehouseId !== undefined)
        updateData.defaultWarehouseId = data.defaultWarehouseId;
      if (data.webhookUrl !== undefined) updateData.webhookUrl = data.webhookUrl;
      if (data.webhookSecret !== undefined)
        updateData.webhookSecret = data.webhookSecret;
      if (data.settings !== undefined) updateData.settings = data.settings;

      const record = await prisma.marketplaceConnection.update({
        where: { id: data.id.toString() },
        data: updateData,
      });

      return mapToDomain(record as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async save(connection: MarketplaceConnection): Promise<void> {
    await prisma.marketplaceConnection.update({
      where: { id: connection.id.toString() },
      data: {
        name: connection.name,
        status: connection.status as PrismaConnectionStatus,
        sellerName: connection.sellerName,
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        tokenExpiresAt: connection.tokenExpiresAt,
        apiKey: connection.apiKey,
        apiSecret: connection.apiSecret,
        syncProducts: connection.syncProducts,
        syncPrices: connection.syncPrices,
        syncStock: connection.syncStock,
        syncOrders: connection.syncOrders,
        syncMessages: connection.syncMessages,
        syncIntervalMin: connection.syncIntervalMin,
        priceTableId: connection.priceTableId,
        commissionPercent: connection.commissionPercent,
        autoCalcPrice: connection.autoCalcPrice,
        priceMultiplier: connection.priceMultiplier,
        fulfillmentType: connection.fulfillmentType as PrismaFulfillmentType,
        defaultWarehouseId: connection.defaultWarehouseId,
        settings: (connection.settings ?? undefined) as Prisma.InputJsonValue | undefined,
        deletedAt: connection.deletedAt,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.marketplaceConnection.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date(), status: 'DISCONNECTED' },
    });
  }
}
