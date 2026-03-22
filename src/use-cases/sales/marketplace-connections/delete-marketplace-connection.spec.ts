import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMarketplaceConnectionUseCase } from './create-marketplace-connection';
import { DeleteMarketplaceConnectionUseCase } from './delete-marketplace-connection';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let createConnection: CreateMarketplaceConnectionUseCase;
let deleteConnection: DeleteMarketplaceConnectionUseCase;

describe('DeleteMarketplaceConnectionUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    createConnection = new CreateMarketplaceConnectionUseCase(
      connectionsRepository,
    );
    deleteConnection = new DeleteMarketplaceConnectionUseCase(
      connectionsRepository,
    );
  });

  it('should soft-delete a connection', async () => {
    const { connection } = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
    });

    const result = await deleteConnection.execute({
      tenantId: 'tenant-1',
      id: connection.id,
    });

    expect(result.message).toBe('Connection deleted successfully.');

    const found = await connectionsRepository.findById(
      connectionsRepository.items[0].id,
      'tenant-1',
    );
    expect(found).toBeNull();
  });

  it('should throw if connection not found', async () => {
    await expect(() =>
      deleteConnection.execute({
        tenantId: 'tenant-1',
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
