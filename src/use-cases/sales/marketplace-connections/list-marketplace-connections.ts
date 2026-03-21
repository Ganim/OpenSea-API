import type { MarketplaceConnectionDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import { marketplaceConnectionToDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';

interface ListMarketplaceConnectionsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
}

interface ListMarketplaceConnectionsUseCaseResponse {
  connections: MarketplaceConnectionDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListMarketplaceConnectionsUseCase {
  constructor(
    private connectionsRepository: MarketplaceConnectionsRepository,
  ) {}

  async execute(
    input: ListMarketplaceConnectionsUseCaseRequest,
  ): Promise<ListMarketplaceConnectionsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [connections, total] = await Promise.all([
      this.connectionsRepository.findMany(page, perPage, input.tenantId),
      this.connectionsRepository.countByTenant(input.tenantId),
    ]);

    return {
      connections: connections.map(marketplaceConnectionToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
