import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMarketplaceConnectionUseCase } from './create-marketplace-connection';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let createConnection: CreateMarketplaceConnectionUseCase;

describe('CreateMarketplaceConnectionUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    createConnection = new CreateMarketplaceConnectionUseCase(
      connectionsRepository,
    );
  });

  it('should create a marketplace connection', async () => {
    const result = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'Minha Loja ML',
      sellerId: 'seller-123',
      sellerName: 'Loja Teste',
      commissionPercent: 14,
    });

    expect(result.connection).toBeDefined();
    expect(result.connection.marketplace).toBe('MERCADO_LIVRE');
    expect(result.connection.name).toBe('Minha Loja ML');
    expect(result.connection.status).toBe('ACTIVE');
    expect(result.connection.syncProducts).toBe(true);
    expect(result.connection.commissionPercent).toBe(14);
  });

  it('should create connection with custom sync settings', async () => {
    const result = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'SHOPEE',
      name: 'Shopee Store',
      syncProducts: true,
      syncPrices: false,
      syncStock: true,
      syncOrders: true,
      syncMessages: false,
      syncIntervalMin: 30,
    });

    expect(result.connection.syncPrices).toBe(false);
    expect(result.connection.syncMessages).toBe(false);
    expect(result.connection.syncIntervalMin).toBe(30);
  });

  it('should not allow empty name', async () => {
    await expect(() =>
      createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'MERCADO_LIVRE',
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(() =>
      createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'MERCADO_LIVRE',
        name: '   ',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow name exceeding 128 characters', async () => {
    await expect(() =>
      createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'MERCADO_LIVRE',
        name: 'A'.repeat(129),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid marketplace type', async () => {
    await expect(() =>
      createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'INVALID',
        name: 'Test',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate marketplace + seller combination', async () => {
    await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store 1',
      sellerId: 'seller-123',
    });

    await expect(() =>
      createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'MERCADO_LIVRE',
        name: 'ML Store 2',
        sellerId: 'seller-123',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow commission percent out of range', async () => {
    await expect(() =>
      createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'SHOPEE',
        name: 'Shopee',
        commissionPercent: -5,
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(() =>
      createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'SHOPEE',
        name: 'Shopee',
        commissionPercent: 105,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow sync interval less than 1 minute', async () => {
    await expect(() =>
      createConnection.execute({
        tenantId: 'tenant-1',
        marketplace: 'AMAZON',
        name: 'Amazon',
        syncIntervalMin: 0,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should trim connection name', async () => {
    const result = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MAGALU',
      name: '  Minha Loja Magalu  ',
    });

    expect(result.connection.name).toBe('Minha Loja Magalu');
  });

  it('should create connection with fulfillment type', async () => {
    const result = await createConnection.execute({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Full',
      fulfillmentType: 'MARKETPLACE',
    });

    expect(result.connection.fulfillmentType).toBe('MARKETPLACE');
  });
});
