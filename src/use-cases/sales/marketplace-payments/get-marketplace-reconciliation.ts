import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';
import type { MarketplacePaymentsRepository } from '@/repositories/sales/marketplace-payments-repository';

interface GetMarketplaceReconciliationUseCaseRequest {
  tenantId: string;
  connectionId: string;
}

interface GetMarketplaceReconciliationUseCaseResponse {
  connectionId: string;
  connectionName: string;
  marketplace: string;
  totalGross: number;
  totalFees: number;
  totalNet: number;
  pendingCount: number;
  settledCount: number;
}

export class GetMarketplaceReconciliationUseCase {
  constructor(
    private connectionsRepository: MarketplaceConnectionsRepository,
    private paymentsRepository: MarketplacePaymentsRepository,
  ) {}

  async execute(
    input: GetMarketplaceReconciliationUseCaseRequest,
  ): Promise<GetMarketplaceReconciliationUseCaseResponse> {
    const connection = await this.connectionsRepository.findById(
      new UniqueEntityID(input.connectionId),
      input.tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError('Connection not found.');
    }

    const reconciliation = await this.paymentsRepository.getReconciliation(
      input.connectionId,
      input.tenantId,
    );

    return {
      connectionId: connection.id.toString(),
      connectionName: connection.name,
      marketplace: connection.marketplace,
      ...reconciliation,
    };
  }
}
