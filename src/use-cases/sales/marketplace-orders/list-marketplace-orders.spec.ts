import { InMemoryMarketplaceOrdersRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMarketplaceOrdersUseCase } from './list-marketplace-orders';

let ordersRepository: InMemoryMarketplaceOrdersRepository;
let sut: ListMarketplaceOrdersUseCase;

describe('ListMarketplaceOrdersUseCase', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryMarketplaceOrdersRepository();
    sut = new ListMarketplaceOrdersUseCase(ordersRepository);
  });

  it('should list orders for a tenant', async () => {
    await ordersRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      externalOrderId: 'EXT-001',
      buyerName: 'Comprador A',
      subtotal: 100,
      netAmount: 85,
      deliveryAddress: { street: 'Rua Teste' },
      receivedAt: new Date(),
    });
    await ordersRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      externalOrderId: 'EXT-002',
      buyerName: 'Comprador B',
      subtotal: 200,
      netAmount: 170,
      deliveryAddress: { street: 'Rua Teste 2' },
      receivedAt: new Date(),
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter orders by connection', async () => {
    await ordersRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      externalOrderId: 'EXT-010',
      buyerName: 'Comprador C',
      subtotal: 50,
      netAmount: 42.5,
      deliveryAddress: { street: 'Rua A' },
      receivedAt: new Date(),
    });
    await ordersRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-2',
      externalOrderId: 'EXT-020',
      buyerName: 'Comprador D',
      subtotal: 75,
      netAmount: 63.75,
      deliveryAddress: { street: 'Rua B' },
      receivedAt: new Date(),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
    });

    expect(result.orders).toHaveLength(1);
  });

  it('should paginate orders', async () => {
    for (let i = 0; i < 5; i++) {
      await ordersRepository.create({
        tenantId: 'tenant-1',
        connectionId: 'conn-1',
        externalOrderId: `EXT-${i}`,
        buyerName: `Comprador ${i}`,
        subtotal: 100,
        netAmount: 85,
        deliveryAddress: { street: `Rua ${i}` },
        receivedAt: new Date(),
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 2,
    });

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });
});
