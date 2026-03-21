import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceConnectionsRepository } from '@/repositories/sales/marketplace-connections-repository';

interface DeleteMarketplaceConnectionUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteMarketplaceConnectionUseCaseResponse {
  message: string;
}

export class DeleteMarketplaceConnectionUseCase {
  constructor(
    private connectionsRepository: MarketplaceConnectionsRepository,
  ) {}

  async execute(
    input: DeleteMarketplaceConnectionUseCaseRequest,
  ): Promise<DeleteMarketplaceConnectionUseCaseResponse> {
    const connection = await this.connectionsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!connection) {
      throw new ResourceNotFoundError('Connection not found.');
    }

    connection.delete();
    await this.connectionsRepository.save(connection);

    return { message: 'Connection deleted successfully.' };
  }
}
