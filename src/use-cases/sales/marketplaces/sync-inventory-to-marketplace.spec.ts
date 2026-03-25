import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { InMemoryMarketplaceListingsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-listings-repository';
import type { MarketplaceAdapter } from '@/services/marketplace/marketplace-adapter.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncInventoryToMarketplaceUseCase } from './sync-inventory-to-marketplace';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let listingsRepository: InMemoryMarketplaceListingsRepository;
let syncInventory: SyncInventoryToMarketplaceUseCase;
let mockAdapter: MarketplaceAdapter;

function createMockAdapter(): MarketplaceAdapter {
  return {
    platform: 'MERCADO_LIVRE',
    getAuthUrl: vi.fn(),
    exchangeCode: vi.fn(),
    refreshToken: vi.fn(),
    createListing: vi.fn(),
    updateListing: vi.fn(),
    deleteListing: vi.fn(),
    fetchOrders: vi.fn(),
    getOrderDetail: vi.fn(),
    updateStock: vi.fn().mockResolvedValue(undefined),
  };
}

describe('SyncInventoryToMarketplaceUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    listingsRepository = new InMemoryMarketplaceListingsRepository();
    mockAdapter = createMockAdapter();
    syncInventory = new SyncInventoryToMarketplaceUseCase(
      connectionsRepository,
      listingsRepository,
      () => mockAdapter,
    );
  });

  it('should update stock for existing listings', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      variantId: 'variant-1',
      externalListingId: 'variant-1',
      status: 'ACTIVE',
      publishedStock: 5,
    });

    const result = await syncInventory.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      inventoryItems: [{ variantId: 'variant-1', availableQuantity: 25 }],
    });

    expect(result.updatedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(mockAdapter.updateStock).toHaveBeenCalledOnce();

    const updatedListing = listingsRepository.items[0];
    expect(updatedListing.publishedStock).toBe(25);
    expect(updatedListing.status).toBe('ACTIVE');
  });

  it('should set listing to OUT_OF_STOCK when quantity is zero', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      variantId: 'variant-1',
      externalListingId: 'variant-1',
      status: 'ACTIVE',
      publishedStock: 10,
    });

    const result = await syncInventory.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      inventoryItems: [{ variantId: 'variant-1', availableQuantity: 0 }],
    });

    expect(result.updatedCount).toBe(1);
    expect(listingsRepository.items[0].status).toBe('OUT_OF_STOCK');
  });

  it('should reactivate listing when stock returns from zero', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      variantId: 'variant-1',
      externalListingId: 'variant-1',
      status: 'OUT_OF_STOCK',
      publishedStock: 0,
    });

    const result = await syncInventory.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      inventoryItems: [{ variantId: 'variant-1', availableQuantity: 15 }],
    });

    expect(result.updatedCount).toBe(1);
    expect(listingsRepository.items[0].status).toBe('ACTIVE');
    expect(listingsRepository.items[0].publishedStock).toBe(15);
  });

  it('should skip variants without existing listings', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    const result = await syncInventory.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      inventoryItems: [{ variantId: 'non-existent', availableQuantity: 10 }],
    });

    expect(result.updatedCount).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(mockAdapter.updateStock).not.toHaveBeenCalled();
  });

  it('should capture errors for individual stock update failures', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      variantId: 'variant-fail',
      externalListingId: 'variant-fail',
      status: 'ACTIVE',
      publishedStock: 5,
    });

    (mockAdapter.updateStock as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('ML API timeout'),
    );

    const result = await syncInventory.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      inventoryItems: [{ variantId: 'variant-fail', availableQuantity: 20 }],
    });

    expect(result.updatedCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(result.errors[0].externalListingId).toBe('variant-fail');
    expect(result.errors[0].message).toContain('timeout');
  });

  it('should throw when inventory items list is empty', async () => {
    await expect(() =>
      syncInventory.execute({
        tenantId: 'tenant-1',
        connectionId: new UniqueEntityID().toString(),
        inventoryItems: [],
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when connection not found', async () => {
    await expect(() =>
      syncInventory.execute({
        tenantId: 'tenant-1',
        connectionId: new UniqueEntityID().toString(),
        inventoryItems: [{ variantId: 'v1', availableQuantity: 10 }],
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when connection is not active', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ERROR',
      accessToken: 'token',
    });

    await expect(() =>
      syncInventory.execute({
        tenantId: 'tenant-1',
        connectionId: connection.id.toString(),
        inventoryItems: [{ variantId: 'v1', availableQuantity: 10 }],
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
