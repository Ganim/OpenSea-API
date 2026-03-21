import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceConnectionDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import { marketplaceConnectionToDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';

interface UpdateMarketplaceConnectionUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  status?: string;
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

interface UpdateMarketplaceConnectionUseCaseResponse {
  connection: MarketplaceConnectionDTO;
}

export class UpdateMarketplaceConnectionUseCase {
  constructor(
    private connectionsRepository: MarketplaceConnectionsRepository,
  ) {}

  async execute(
    input: UpdateMarketplaceConnectionUseCaseRequest,
  ): Promise<UpdateMarketplaceConnectionUseCaseResponse> {
    const connection = await this.connectionsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError('Connection not found.');
    }

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new BadRequestError('Connection name is required.');
      }
      if (input.name.length > 128) {
        throw new BadRequestError(
          'Connection name cannot exceed 128 characters.',
        );
      }
      connection.name = input.name.trim();
    }

    if (
      input.commissionPercent !== undefined &&
      (input.commissionPercent < 0 || input.commissionPercent > 100)
    ) {
      throw new BadRequestError(
        'Commission percent must be between 0 and 100.',
      );
    }

    if (input.status !== undefined) connection.status = input.status as any;
    if (input.sellerName !== undefined)
      connection.sellerName = input.sellerName;
    if (input.accessToken !== undefined)
      connection.accessToken = input.accessToken;
    if (input.refreshToken !== undefined)
      connection.refreshToken = input.refreshToken;
    if (input.tokenExpiresAt !== undefined)
      connection.tokenExpiresAt = input.tokenExpiresAt;
    if (input.apiKey !== undefined) connection.apiKey = input.apiKey;
    if (input.apiSecret !== undefined) connection.apiSecret = input.apiSecret;
    if (input.syncProducts !== undefined)
      connection.syncProducts = input.syncProducts;
    if (input.syncPrices !== undefined)
      connection.syncPrices = input.syncPrices;
    if (input.syncStock !== undefined) connection.syncStock = input.syncStock;
    if (input.syncOrders !== undefined)
      connection.syncOrders = input.syncOrders;
    if (input.syncMessages !== undefined)
      connection.syncMessages = input.syncMessages;
    if (input.syncIntervalMin !== undefined)
      connection.syncIntervalMin = input.syncIntervalMin;
    if (input.priceTableId !== undefined)
      connection.priceTableId = input.priceTableId;
    if (input.commissionPercent !== undefined)
      connection.commissionPercent = input.commissionPercent;
    if (input.autoCalcPrice !== undefined)
      connection.autoCalcPrice = input.autoCalcPrice;
    if (input.priceMultiplier !== undefined)
      connection.priceMultiplier = input.priceMultiplier;
    if (input.fulfillmentType !== undefined)
      connection.fulfillmentType = input.fulfillmentType as any;
    if (input.defaultWarehouseId !== undefined)
      connection.defaultWarehouseId = input.defaultWarehouseId;
    if (input.settings !== undefined) connection.settings = input.settings;

    await this.connectionsRepository.save(connection);

    return { connection: marketplaceConnectionToDTO(connection) };
  }
}
