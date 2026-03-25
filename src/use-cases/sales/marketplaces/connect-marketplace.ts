import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceType } from '@/entities/sales/marketplace-connection';
import type { MarketplaceConnectionDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import { marketplaceConnectionToDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';
import type {
  MarketplaceAdapter,
  OAuthTokens,
} from '@/services/marketplace/marketplace-adapter.interface';

interface ConnectMarketplaceUseCaseRequest {
  tenantId: string;
  connectionId: string;
  code: string;
  redirectUri: string;
}

interface ConnectMarketplaceUseCaseResponse {
  connection: MarketplaceConnectionDTO;
  tokens: OAuthTokens;
}

export class ConnectMarketplaceUseCase {
  constructor(
    private readonly connectionsRepository: MarketplaceConnectionsRepository,
    private readonly adapterResolver: (
      platform: MarketplaceType,
    ) => MarketplaceAdapter,
  ) {}

  async execute(
    input: ConnectMarketplaceUseCaseRequest,
  ): Promise<ConnectMarketplaceUseCaseResponse> {
    if (!input.code || input.code.trim().length === 0) {
      throw new BadRequestError('OAuth authorization code is required.');
    }

    if (!input.redirectUri || input.redirectUri.trim().length === 0) {
      throw new BadRequestError('Redirect URI is required.');
    }

    const connection = await this.connectionsRepository.findById(
      new UniqueEntityID(input.connectionId),
      input.tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError('Marketplace connection not found.');
    }

    const adapter = this.adapterResolver(connection.marketplace);

    const oauthTokens = await adapter.exchangeCode(
      input.code.trim(),
      input.redirectUri.trim(),
    );

    connection.accessToken = oauthTokens.accessToken;
    connection.refreshToken = oauthTokens.refreshToken;
    connection.tokenExpiresAt = oauthTokens.expiresAt;
    connection.status = 'ACTIVE';

    await this.connectionsRepository.save(connection);

    return {
      connection: marketplaceConnectionToDTO(connection),
      tokens: oauthTokens,
    };
  }
}
