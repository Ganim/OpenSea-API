import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { InMemoryMarketplaceListingsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-listings-repository';
import type { MarketplaceAdapter } from '@/services/marketplace/marketplace-adapter.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncProductsToMarketplaceUseCase } from './sync-products-to-marketplace';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let listingsRepository: InMemoryMarketplaceListingsRepository;
let syncProducts: SyncProductsToMarketplaceUseCase;
let mockAdapter: MarketplaceAdapter;

function createMockAdapter(): MarketplaceAdapter {
  return {
    platform: 'MERCADO_LIVRE',
    getAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshToken: vi.fn(),
    createListing: vi.fn().mockResolvedValue({
      externalId: 'ML-12345',
      permalink: 'https://produto.mercadolivre.com.br/ML-12345',
      status: 'active',
    }),
    updateListing: vi.fn().mockResolvedValue(undefined),
    deleteListing: vi.fn(),
    fetchOrders: vi.fn(),
    getOrderDetail: vi.fn(),
    updateStock: vi.fn(),
  };
}

describe('SyncProductsToMarketplaceUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    listingsRepository = new InMemoryMarketplaceListingsRepository();
    mockAdapter = createMockAdapter();
    syncProducts = new SyncProductsToMarketplaceUseCase(
      connectionsRepository,
      listingsRepository,
      () => mockAdapter,
    );
  });

  it('should create listings for new products', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    const result = await syncProducts.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      products: [
        {
          variantId: 'variant-1',
          title: 'Camiseta Preta',
          description: 'Camiseta algodao preta',
          price: 49.9,
          quantity: 10,
          categoryId: 'MLB1051',
          images: ['https://cdn.example.com/img1.jpg'],
          sku: 'CAM-PT-M',
        },
      ],
    });

    expect(result.syncedListings).toHaveLength(1);
    expect(result.failedCount).toBe(0);
    expect(result.syncedListings[0].externalListingId).toBe('ML-12345');
    expect(result.syncedListings[0].publishedPrice).toBe(49.9);
    expect(mockAdapter.createListing).toHaveBeenCalledOnce();
  });

  it('should update existing listings', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    // Create an existing listing linked by variantId as externalListingId lookup key
    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      variantId: 'variant-1',
      externalListingId: 'variant-1',
      status: 'ACTIVE',
      publishedPrice: 39.9,
      publishedStock: 5,
    });

    const result = await syncProducts.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      products: [
        {
          variantId: 'variant-1',
          title: 'Camiseta Preta v2',
          description: 'Camiseta algodao preta atualizada',
          price: 59.9,
          quantity: 20,
          categoryId: 'MLB1051',
          images: ['https://cdn.example.com/img2.jpg'],
        },
      ],
    });

    expect(result.syncedListings).toHaveLength(1);
    expect(result.failedCount).toBe(0);
    expect(result.syncedListings[0].publishedPrice).toBe(59.9);
    expect(result.syncedListings[0].publishedStock).toBe(20);
    expect(mockAdapter.updateListing).toHaveBeenCalledOnce();
    expect(mockAdapter.createListing).not.toHaveBeenCalled();
  });

  it('should throw when products list is empty', async () => {
    await expect(() =>
      syncProducts.execute({
        tenantId: 'tenant-1',
        connectionId: new UniqueEntityID().toString(),
        products: [],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when connection not found', async () => {
    await expect(() =>
      syncProducts.execute({
        tenantId: 'tenant-1',
        connectionId: new UniqueEntityID().toString(),
        products: [
          {
            variantId: 'v1',
            title: 'Test',
            description: 'Test',
            price: 10,
            quantity: 1,
            categoryId: 'cat1',
            images: [],
          },
        ],
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when connection is not active', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'PAUSED',
      accessToken: 'valid-token',
    });

    await expect(() =>
      syncProducts.execute({
        tenantId: 'tenant-1',
        connectionId: connection.id.toString(),
        products: [
          {
            variantId: 'v1',
            title: 'Test',
            description: 'Test',
            price: 10,
            quantity: 1,
            categoryId: 'cat1',
            images: [],
          },
        ],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when connection has no access token', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
    });

    await expect(() =>
      syncProducts.execute({
        tenantId: 'tenant-1',
        connectionId: connection.id.toString(),
        products: [
          {
            variantId: 'v1',
            title: 'Test',
            description: 'Test',
            price: 10,
            quantity: 1,
            categoryId: 'cat1',
            images: [],
          },
        ],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should capture errors for individual product sync failures', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    (mockAdapter.createListing as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        externalId: 'ML-1',
        status: 'active',
      })
      .mockRejectedValueOnce(new Error('ML API rate limit exceeded'));

    const result = await syncProducts.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      products: [
        {
          variantId: 'variant-ok',
          title: 'Product OK',
          description: 'OK',
          price: 10,
          quantity: 5,
          categoryId: 'cat1',
          images: [],
        },
        {
          variantId: 'variant-fail',
          title: 'Product Fail',
          description: 'Fail',
          price: 20,
          quantity: 3,
          categoryId: 'cat2',
          images: [],
        },
      ],
    });

    expect(result.syncedListings).toHaveLength(1);
    expect(result.failedCount).toBe(1);
    expect(result.errors[0].variantId).toBe('variant-fail');
    expect(result.errors[0].message).toContain('rate limit');
  });
});
