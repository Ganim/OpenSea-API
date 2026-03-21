import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMarketplaceOrdersRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AcknowledgeMarketplaceOrderUseCase } from './acknowledge-marketplace-order';

let ordersRepository: InMemoryMarketplaceOrdersRepository;
let acknowledgeOrder: AcknowledgeMarketplaceOrderUseCase;

describe('AcknowledgeMarketplaceOrderUseCase', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryMarketplaceOrdersRepository();
    acknowledgeOrder = new AcknowledgeMarketplaceOrderUseCase(ordersRepository);
  });

  it('should acknowledge a received order', async () => {
    const order = await ordersRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      externalOrderId: 'EXT-001',
      buyerName: 'John Doe',
      subtotal: 100,
      netAmount: 85,
      deliveryAddress: { street: 'Rua Teste', city: 'SP' },
      receivedAt: new Date(),
    });

    const result = await acknowledgeOrder.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
    });

    expect(result.order.status).toBe('ACKNOWLEDGED');
    expect(result.order.acknowledgedAt).toBeDefined();
  });

  it('should throw if order not found', async () => {
    await expect(() =>
      acknowledgeOrder.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw if order is not in RECEIVED status', async () => {
    const order = await ordersRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      externalOrderId: 'EXT-002',
      buyerName: 'Jane Doe',
      subtotal: 50,
      netAmount: 42.5,
      deliveryAddress: { street: 'Rua Teste 2' },
      receivedAt: new Date(),
    });

    // Acknowledge once
    order.acknowledge();
    await ordersRepository.save(order);

    // Try again
    await expect(() =>
      acknowledgeOrder.execute({
        tenantId: 'tenant-1',
        id: order.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
