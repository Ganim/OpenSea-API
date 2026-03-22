import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMarketplaceConnectionUseCase } from './create-marketplace-connection';
import { ListMarketplaceConnectionsUseCase } from './list-marketplace-connections';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let createConnection: CreateMarketplaceConnectionUseCase;
let listConnections: ListMarketplaceConnectionsUseCase;

describe('ListMarketplaceConnectionsUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    createConnection = new CreateMarketplaceConnectionUseCase(
      connectionsRepository,
    );
    listConnections = new ListMarketplaceConnectionsUseCase(
      connectionsRepository,
    );
  });

  it('should list connections for a tenant', async () => {
    await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML',
    });
    await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'SHOPEE',
      name: 'Shopee',
    });

    const result = await listConnections.execute({ tenantId: 'tenant-1' });

    expect(result.connections).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'CUSTOM',
        name: `Store ${i}`,
      });
    }

    const result = await listConnections.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 2,
    });

    expect(result.connections).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should not return connections from other tenants', async () => {
    await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML',
    });
    await createConnection.execute({
      tenantId: 'tenant-2',
      marketplace: 'SHOPEE',
      name: 'Shopee',
    });

    const result = await listConnections.execute({ tenantId: 'tenant-1' });

    expect(result.connections).toHaveLength(1);
    expect(result.connections[0].marketplace).toBe('MERCADO_LIVRE');
  });
});
