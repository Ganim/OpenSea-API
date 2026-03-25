import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { InMemoryMarketplaceOrdersRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-orders-repository';
import type { MarketplaceAdapter } from '@/services/marketplace/marketplace-adapter.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImportMarketplaceOrdersUseCase } from './import-marketplace-orders';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let ordersRepository: InMemoryMarketplaceOrdersRepository;
let importOrders: ImportMarketplaceOrdersUseCase;
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
    fetchOrders: vi.fn().mockResolvedValue({
      data: [
        {
          externalOrderId: 'ML-ORDER-001',
          status: 'paid',
          buyerName: 'Joao Silva',
          buyerEmail: 'joao@email.com',
          items: [
            {
              externalId: 'ML-ITEM-1',
              title: 'Camiseta',
              quantity: 2,
              unitPrice: 49.9,
            },
          ],
          totalAmount: 99.8,
          shippingCost: 15,
          commission: 12,
          paymentStatus: 'approved',
          createdAt: new Date('2026-03-20'),
        },
        {
          externalOrderId: 'ML-ORDER-002',
          status: 'paid',
          buyerName: 'Maria Souza',
          items: [
            {
              externalId: 'ML-ITEM-2',
              title: 'Calca',
              quantity: 1,
              unitPrice: 89.9,
            },
          ],
          totalAmount: 89.9,
          shippingCost: 10,
          commission: 8,
          paymentStatus: 'approved',
          createdAt: new Date('2026-03-21'),
        },
      ],
      total: 2,
      hasMore: false,
    }),
    getOrderDetail: vi.fn(),
    updateStock: vi.fn(),
  };
}

describe('ImportMarketplaceOrdersUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    ordersRepository = new InMemoryMarketplaceOrdersRepository();
    mockAdapter = createMockAdapter();
    importOrders = new ImportMarketplaceOrdersUseCase(
      connectionsRepository,
      ordersRepository,
      () => mockAdapter,
    );
  });

  it('should import orders from marketplace', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    const result = await importOrders.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      since: new Date('2026-03-01'),
    });

    expect(result.importedOrders).toHaveLength(2);
    expect(result.skippedCount).toBe(0);
    expect(result.totalFetched).toBe(2);
    expect(result.importedOrders[0].externalOrderId).toBe('ML-ORDER-001');
    expect(result.importedOrders[0].buyerName).toBe('Joao Silva');
    expect(result.importedOrders[0].status).toBe('RECEIVED');
    expect(ordersRepository.items).toHaveLength(2);
  });

  it('should skip already imported orders', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    // Pre-create one order
    await ordersRepository.create({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      externalOrderId: 'ML-ORDER-001',
      buyerName: 'Joao Silva',
      subtotal: 99.8,
      netAmount: 72.8,
      deliveryAddress: {},
      receivedAt: new Date(),
    });

    const result = await importOrders.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      since: new Date('2026-03-01'),
    });

    expect(result.importedOrders).toHaveLength(1);
    expect(result.skippedCount).toBe(1);
    expect(result.totalFetched).toBe(2);
    expect(result.importedOrders[0].externalOrderId).toBe('ML-ORDER-002');
  });

  it('should handle paginated results', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      status: 'ACTIVE',
      accessToken: 'valid-token',
      sellerId: 'seller-1',
    });

    (mockAdapter.fetchOrders as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        data: [
          {
            externalOrderId: 'ORDER-PAGE1',
            status: 'paid',
            buyerName: 'Buyer 1',
            items: [],
            totalAmount: 50,
            shippingCost: 5,
            commission: 3,
            paymentStatus: 'approved',
            createdAt: new Date(),
          },
        ],
        total: 2,
        hasMore: true,
        cursor: '50',
      })
      .mockResolvedValueOnce({
        data: [
          {
            externalOrderId: 'ORDER-PAGE2',
            status: 'paid',
            buyerName: 'Buyer 2',
            items: [],
            totalAmount: 100,
            shippingCost: 10,
            commission: 6,
            paymentStatus: 'approved',
            createdAt: new Date(),
          },
        ],
        total: 2,
        hasMore: false,
      });

    const result = await importOrders.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      since: new Date('2026-03-01'),
    });

    expect(result.importedOrders).toHaveLength(2);
    expect(result.totalFetched).toBe(2);
    expect(mockAdapter.fetchOrders).toHaveBeenCalledTimes(2);
  });

  it('should throw when connection not found', async () => {
    await expect(() =>
      importOrders.execute({
        tenantId: 'tenant-1',
        connectionId: new UniqueEntityID().toString(),
        since: new Date(),
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
      importOrders.execute({
        tenantId: 'tenant-1',
        connectionId: connection.id.toString(),
        since: new Date(),
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
      importOrders.execute({
        tenantId: 'tenant-1',
        connectionId: connection.id.toString(),
        since: new Date(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
