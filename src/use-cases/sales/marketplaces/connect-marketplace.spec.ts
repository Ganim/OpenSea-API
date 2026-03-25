import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MarketplaceType } from '@/entities/sales/marketplace-connection';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import type { MarketplaceAdapter } from '@/services/marketplace/marketplace-adapter.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectMarketplaceUseCase } from './connect-marketplace';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let connectMarketplace: ConnectMarketplaceUseCase;
let mockAdapter: MarketplaceAdapter;

function createMockAdapter(): MarketplaceAdapter {
  return {
    platform: 'MERCADO_LIVRE',
    getAuthUrl: vi.fn(),
    exchangeCode: vi.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 21600 * 1000),
      userId: 'ml-user-123',
    }),
    refreshToken: vi.fn(),
    createListing: vi.fn(),
    updateListing: vi.fn(),
    deleteListing: vi.fn(),
    fetchOrders: vi.fn(),
    getOrderDetail: vi.fn(),
    updateStock: vi.fn(),
  };
}

describe('ConnectMarketplaceUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    mockAdapter = createMockAdapter();
    connectMarketplace = new ConnectMarketplaceUseCase(
      connectionsRepository,
      () => mockAdapter,
    );
  });

  it('should exchange code and update connection tokens', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'DISCONNECTED',
    });

    const result = await connectMarketplace.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      code: 'oauth-code-abc',
      redirectUri: 'https://app.opensea.com/callback',
    });

    expect(result.connection.status).toBe('ACTIVE');
    expect(result.tokens.accessToken).toBe('new-access-token');
    expect(result.tokens.refreshToken).toBe('new-refresh-token');
    expect(mockAdapter.exchangeCode).toHaveBeenCalledWith(
      'oauth-code-abc',
      'https://app.opensea.com/callback',
    );
  });

  it('should throw when code is empty', async () => {
    await expect(() =>
      connectMarketplace.execute({
        tenantId: 'tenant-1',
        connectionId: new UniqueEntityID().toString(),
        code: '',
        redirectUri: 'https://app.opensea.com/callback',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when redirect URI is empty', async () => {
    await expect(() =>
      connectMarketplace.execute({
        tenantId: 'tenant-1',
        connectionId: new UniqueEntityID().toString(),
        code: 'code',
        redirectUri: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when connection not found', async () => {
    await expect(() =>
      connectMarketplace.execute({
        tenantId: 'tenant-1',
        connectionId: new UniqueEntityID().toString(),
        code: 'code',
        redirectUri: 'https://app.opensea.com/callback',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should call the adapter resolver with the correct platform', async () => {
    const adapterResolver = vi.fn().mockReturnValue(mockAdapter);
    const useCase = new ConnectMarketplaceUseCase(
      connectionsRepository,
      adapterResolver as (platform: MarketplaceType) => MarketplaceAdapter,
    );

    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'SHOPEE',
      name: 'Shopee Store',
    });

    await useCase.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      code: 'shopee-code',
      redirectUri: 'https://app.opensea.com/callback',
    });

    expect(adapterResolver).toHaveBeenCalledWith('SHOPEE');
  });
});
