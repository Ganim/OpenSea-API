import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMarketplaceConnectionUseCase } from './create-marketplace-connection';
import { UpdateMarketplaceConnectionUseCase } from './update-marketplace-connection';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let createConnection: CreateMarketplaceConnectionUseCase;
let sut: UpdateMarketplaceConnectionUseCase;

describe('UpdateMarketplaceConnectionUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    createConnection = new CreateMarketplaceConnectionUseCase(
      connectionsRepository,
    );
    sut = new UpdateMarketplaceConnectionUseCase(connectionsRepository);
  });

  it('should update a connection successfully', async () => {
    const { connection } = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: connection.id,
      name: 'ML Store Updated',
      commissionPercent: 12,
      syncProducts: false,
    });

    expect(result.connection.name).toBe('ML Store Updated');
    expect(result.connection.commissionPercent).toBe(12);
    expect(result.connection.syncProducts).toBe(false);
  });

  it('should throw when connection is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        name: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when name is empty', async () => {
    const { connection } = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'SHOPEE',
      name: 'Shopee Store',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: connection.id,
        name: '   ',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when name exceeds 128 characters', async () => {
    const { connection } = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'AMAZON',
      name: 'Amazon Store',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: connection.id,
        name: 'A'.repeat(129),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when commission percent is out of range', async () => {
    const { connection } = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MAGALU',
      name: 'Magalu Store',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: connection.id,
        commissionPercent: 105,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
