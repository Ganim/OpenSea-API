import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { MarketplaceConnectionDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import { marketplaceConnectionToDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';
import type {
  MarketplaceType,
  MarketplaceFulfillmentTypeValue,
} from '@/entities/sales/marketplace-connection';

const VALID_MARKETPLACES: MarketplaceType[] = [
  'MERCADO_LIVRE',
  'SHOPEE',
  'AMAZON',
  'MAGALU',
  'TIKTOK_SHOP',
  'AMERICANAS',
  'ALIEXPRESS',
  'CASAS_BAHIA',
  'SHEIN',
  'CUSTOM',
];

interface CreateMarketplaceConnectionUseCaseRequest {
  tenantId: string;
  marketplace: string;
  name: string;
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
  fulfillmentType?: string;
  defaultWarehouseId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  settings?: Record<string, unknown>;
}

interface CreateMarketplaceConnectionUseCaseResponse {
  connection: MarketplaceConnectionDTO;
}

export class CreateMarketplaceConnectionUseCase {
  constructor(
    private connectionsRepository: MarketplaceConnectionsRepository,
  ) {}

  async execute(
    input: CreateMarketplaceConnectionUseCaseRequest,
  ): Promise<CreateMarketplaceConnectionUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Connection name is required.');
    }

    if (input.name.length > 128) {
      throw new BadRequestError(
        'Connection name cannot exceed 128 characters.',
      );
    }

    if (!VALID_MARKETPLACES.includes(input.marketplace as MarketplaceType)) {
      throw new BadRequestError('Invalid marketplace type.');
    }

    if (input.sellerId) {
      const existing =
        await this.connectionsRepository.findByMarketplaceAndSeller(
          input.marketplace as MarketplaceType,
          input.sellerId,
          input.tenantId,
        );
      if (existing) {
        throw new BadRequestError(
          'A connection for this marketplace and seller already exists.',
        );
      }
    }

    if (
      input.commissionPercent !== undefined &&
      (input.commissionPercent < 0 || input.commissionPercent > 100)
    ) {
      throw new BadRequestError(
        'Commission percent must be between 0 and 100.',
      );
    }

    if (input.syncIntervalMin !== undefined && input.syncIntervalMin < 1) {
      throw new BadRequestError('Sync interval must be at least 1 minute.');
    }

    const connection = await this.connectionsRepository.create({
      tenantId: input.tenantId,
      marketplace: input.marketplace as MarketplaceType,
      name: input.name.trim(),
      sellerId: input.sellerId,
      sellerName: input.sellerName,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      tokenExpiresAt: input.tokenExpiresAt,
      apiKey: input.apiKey,
      apiSecret: input.apiSecret,
      syncProducts: input.syncProducts,
      syncPrices: input.syncPrices,
      syncStock: input.syncStock,
      syncOrders: input.syncOrders,
      syncMessages: input.syncMessages,
      syncIntervalMin: input.syncIntervalMin,
      priceTableId: input.priceTableId,
      commissionPercent: input.commissionPercent,
      autoCalcPrice: input.autoCalcPrice,
      priceMultiplier: input.priceMultiplier,
      fulfillmentType: input.fulfillmentType as
        | MarketplaceFulfillmentTypeValue
        | undefined,
      defaultWarehouseId: input.defaultWarehouseId,
      webhookUrl: input.webhookUrl,
      webhookSecret: input.webhookSecret,
      settings: input.settings,
    });

    return { connection: marketplaceConnectionToDTO(connection) };
  }
}
