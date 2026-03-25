import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceType } from '@/entities/sales/marketplace-connection';
import type { MarketplaceOrderDTO as DomainMarketplaceOrderDTO } from '@/mappers/sales/marketplace/marketplace-order-to-dto';
import { marketplaceOrderToDTO } from '@/mappers/sales/marketplace/marketplace-order-to-dto';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';
import type { MarketplaceOrdersRepository } from '@/repositories/sales/marketplace-orders-repository';
import type {
  MarketplaceAdapter,
  MarketplaceOrderDTO as AdapterOrderDTO,
  OAuthTokens,
} from '@/services/marketplace/marketplace-adapter.interface';

interface ImportMarketplaceOrdersUseCaseRequest {
  tenantId: string;
  connectionId: string;
  since: Date;
}

interface ImportMarketplaceOrdersUseCaseResponse {
  importedOrders: DomainMarketplaceOrderDTO[];
  skippedCount: number;
  totalFetched: number;
}

export class ImportMarketplaceOrdersUseCase {
  constructor(
    private readonly connectionsRepository: MarketplaceConnectionsRepository,
    private readonly ordersRepository: MarketplaceOrdersRepository,
    private readonly adapterResolver: (
      platform: MarketplaceType,
    ) => MarketplaceAdapter,
  ) {}

  async execute(
    input: ImportMarketplaceOrdersUseCaseRequest,
  ): Promise<ImportMarketplaceOrdersUseCaseResponse> {
    if (!input.since || !(input.since instanceof Date)) {
      throw new BadRequestError(
        'A valid "since" date is required for order import.',
      );
    }

    const connection = await this.connectionsRepository.findById(
      new UniqueEntityID(input.connectionId),
      input.tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError('Marketplace connection not found.');
    }

    if (connection.status !== 'ACTIVE') {
      throw new BadRequestError(
        'Marketplace connection must be active to import orders.',
      );
    }

    if (!connection.accessToken) {
      throw new BadRequestError(
        'Marketplace connection has no access token. Please reconnect.',
      );
    }

    const adapter = this.adapterResolver(connection.marketplace);

    const tokens: OAuthTokens = {
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken ?? '',
      expiresAt: connection.tokenExpiresAt ?? new Date(),
      userId: connection.sellerId,
    };

    const importedOrders: DomainMarketplaceOrderDTO[] = [];
    let skippedCount = 0;
    let totalFetched = 0;
    let cursor: string | undefined;
    let hasMorePages = true;

    while (hasMorePages) {
      const ordersPage = await adapter.fetchOrders(tokens, input.since, cursor);

      totalFetched += ordersPage.data.length;

      for (const adapterOrder of ordersPage.data) {
        const existingOrder = await this.ordersRepository.findByExternalId(
          input.connectionId,
          adapterOrder.externalOrderId,
        );

        if (existingOrder) {
          skippedCount++;
          continue;
        }

        const persistedOrder = await this.persistAdapterOrder(
          input.tenantId,
          input.connectionId,
          adapterOrder,
        );

        importedOrders.push(marketplaceOrderToDTO(persistedOrder));
      }

      hasMorePages = ordersPage.hasMore;
      cursor = ordersPage.cursor;
    }

    return {
      importedOrders,
      skippedCount,
      totalFetched,
    };
  }

  private async persistAdapterOrder(
    tenantId: string,
    connectionId: string,
    adapterOrder: AdapterOrderDTO,
  ) {
    const subtotal = adapterOrder.totalAmount;
    const netAmount =
      subtotal - adapterOrder.shippingCost - adapterOrder.commission;

    return this.ordersRepository.create({
      tenantId,
      connectionId,
      externalOrderId: adapterOrder.externalOrderId,
      status: 'RECEIVED',
      buyerName: adapterOrder.buyerName,
      buyerEmail: adapterOrder.buyerEmail,
      buyerPhone: adapterOrder.buyerPhone,
      subtotal,
      shippingCost: adapterOrder.shippingCost,
      marketplaceFee: adapterOrder.commission,
      netAmount,
      deliveryAddress: {},
      receivedAt: adapterOrder.createdAt,
    });
  }
}
