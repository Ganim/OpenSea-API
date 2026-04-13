import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Order } from '@/entities/sales/order';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncOfflineOrdersUseCase } from './sync-offline-orders';

let ordersRepository: InMemoryOrdersRepository;
let createPdvOrderUseCase: any;
let addOrderItemUseCase: any;
let sendToCashierUseCase: any;
let sut: SyncOfflineOrdersUseCase;

const tenantId = 'tenant-1';
const userId = 'user-1';

describe('SyncOfflineOrdersUseCase', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();

    createPdvOrderUseCase = {
      execute: vi.fn().mockImplementation(async () => {
        const order = Order.create({
          tenantId: new UniqueEntityID(tenantId),
          orderNumber: `ORD-${Date.now()}`,
          type: 'ORDER',
          status: 'DRAFT',
          customerId: new UniqueEntityID('customer-1'),
          pipelineId: new UniqueEntityID('pipeline-1'),
          stageId: new UniqueEntityID('stage-1'),
          channel: 'POS',
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          shippingTotal: 0,
          grandTotal: 0,
          currency: 'BRL',
          creditUsed: 0,
          paidAmount: 0,
          remainingAmount: 0,
          needsApproval: false,
          tags: [],
          stageEnteredAt: new Date(),
        });
        ordersRepository.items.push(order);
        return { order };
      }),
    };

    addOrderItemUseCase = {
      execute: vi.fn().mockResolvedValue({}),
    };

    sendToCashierUseCase = {
      execute: vi.fn().mockResolvedValue({}),
    };

    sut = new SyncOfflineOrdersUseCase(
      createPdvOrderUseCase,
      addOrderItemUseCase,
      sendToCashierUseCase,
      ordersRepository,
    );
  });

  it('should sync a single offline order successfully', async () => {
    const result = await sut.execute({
      tenantId,
      userId,
      orders: [
        {
          offlineRef: 'OFF-001',
          items: [{ variantId: 'variant-1', quantity: 2 }],
        },
      ],
    });

    expect(result.synced).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(result.synced[0].offlineRef).toBe('OFF-001');
    expect(createPdvOrderUseCase.execute).toHaveBeenCalledTimes(1);
    expect(addOrderItemUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should skip already synced orders by offlineRef', async () => {
    // Pre-create an order with the saleCode
    const existingOrder = Order.create({
      tenantId: new UniqueEntityID(tenantId),
      orderNumber: 'ORD-EXISTING',
      type: 'ORDER',
      status: 'DRAFT',
      customerId: new UniqueEntityID('customer-1'),
      pipelineId: new UniqueEntityID('pipeline-1'),
      stageId: new UniqueEntityID('stage-1'),
      channel: 'POS',
      subtotal: 100,
      discountTotal: 0,
      taxTotal: 0,
      shippingTotal: 0,
      grandTotal: 100,
      currency: 'BRL',
      creditUsed: 0,
      paidAmount: 0,
      remainingAmount: 100,
      needsApproval: false,
      tags: [],
      stageEnteredAt: new Date(),
      saleCode: 'OFF-EXISTING',
    });
    ordersRepository.items.push(existingOrder);

    const result = await sut.execute({
      tenantId,
      userId,
      orders: [
        {
          offlineRef: 'OFF-EXISTING',
          items: [{ variantId: 'variant-1' }],
        },
      ],
    });

    expect(result.synced).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(createPdvOrderUseCase.execute).not.toHaveBeenCalled();
  });

  it('should capture failures without stopping the batch', async () => {
    createPdvOrderUseCase.execute
      .mockRejectedValueOnce(new Error('Something went wrong'))
      .mockImplementationOnce(async () => {
        const order = Order.create({
          tenantId: new UniqueEntityID(tenantId),
          orderNumber: 'ORD-OK',
          type: 'ORDER',
          status: 'DRAFT',
          customerId: new UniqueEntityID('customer-1'),
          pipelineId: new UniqueEntityID('pipeline-1'),
          stageId: new UniqueEntityID('stage-1'),
          channel: 'POS',
          subtotal: 0,
          discountTotal: 0,
          taxTotal: 0,
          shippingTotal: 0,
          grandTotal: 0,
          currency: 'BRL',
          creditUsed: 0,
          paidAmount: 0,
          remainingAmount: 0,
          needsApproval: false,
          tags: [],
          stageEnteredAt: new Date(),
        });
        ordersRepository.items.push(order);
        return { order };
      });

    const result = await sut.execute({
      tenantId,
      userId,
      orders: [
        { offlineRef: 'OFF-FAIL', items: [{ variantId: 'v1' }] },
        { offlineRef: 'OFF-OK', items: [{ variantId: 'v2' }] },
      ],
    });

    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].offlineRef).toBe('OFF-FAIL');
    expect(result.synced).toHaveLength(1);
  });

  it('should send order to cashier when sendToCashier is true', async () => {
    await sut.execute({
      tenantId,
      userId,
      orders: [
        {
          offlineRef: 'OFF-CASHIER',
          sendToCashier: true,
          items: [{ variantId: 'variant-1' }],
        },
      ],
    });

    expect(sendToCashierUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
