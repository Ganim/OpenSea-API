import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PurchaseOrderItem } from '@/entities/stock/purchase-order';
import { InMemoryPurchaseOrdersRepository } from '@/repositories/stock/in-memory/in-memory-purchase-orders-repository';
import { makePurchaseOrder } from '@/utils/tests/factories/make-purchase-order';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

import { ReceivePurchaseOrderUseCase } from './receive-purchase-order';
import type { RegisterItemEntryUseCase } from '../items/register-item-entry';

let purchaseOrdersRepository: InMemoryPurchaseOrdersRepository;
let mockRegisterItemEntry: RegisterItemEntryUseCase;
let sut: ReceivePurchaseOrderUseCase;

const USER_ID = 'user-1';

function makeConfirmedOrderWithItems() {
  const order = makePurchaseOrder({ status: 'CONFIRMED' });
  const variantId1 = new UniqueEntityID();
  const variantId2 = new UniqueEntityID();

  const item1 = PurchaseOrderItem.create({
    orderId: order.id,
    variantId: variantId1,
    quantity: 10,
    unitCost: 5,
  });
  const item2 = PurchaseOrderItem.create({
    orderId: order.id,
    variantId: variantId2,
    quantity: 20,
    unitCost: 8,
  });

  // Access internal items array to add items to confirmed order
  (order as any).props.items.push(item1, item2);
  (order as unknown as { props: Record<string, unknown> }).props.totalCost =
    item1.totalCost + item2.totalCost;

  purchaseOrdersRepository.items.push(order);

  return { order, variantId1, variantId2 };
}

describe('ReceivePurchaseOrderUseCase', () => {
  beforeEach(() => {
    purchaseOrdersRepository = new InMemoryPurchaseOrdersRepository();
    mockRegisterItemEntry = {
      execute: vi.fn().mockResolvedValue({
        item: { id: new UniqueEntityID().toString() },
        movement: { id: new UniqueEntityID().toString() },
      }),
    } as unknown as RegisterItemEntryUseCase;
    sut = new ReceivePurchaseOrderUseCase(
      purchaseOrdersRepository,
      mockRegisterItemEntry,
    );
  });

  it('should receive a confirmed purchase order', async () => {
    const { order } = makeConfirmedOrderWithItems();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
      userId: USER_ID,
    });

    expect(result.purchaseOrder.status).toBe('DELIVERED');
    expect(result.entries).toHaveLength(2);
    expect(mockRegisterItemEntry.execute).toHaveBeenCalledTimes(2);
  });

  it('should pass correct data to RegisterItemEntryUseCase', async () => {
    const { order, variantId1 } = makeConfirmedOrderWithItems();

    await sut.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
      userId: USER_ID,
    });

    const firstCall = vi.mocked(mockRegisterItemEntry.execute).mock.calls[0][0];
    expect(firstCall.tenantId).toBe('tenant-1');
    expect(firstCall.variantId).toBe(variantId1.toString());
    expect(firstCall.quantity).toBe(10);
    expect(firstCall.userId).toBe(USER_ID);
    expect(firstCall.movementType).toBe('PURCHASE');
    expect(firstCall.unitCost).toBe(5);
  });

  it('should support partial receive via itemOverrides', async () => {
    const { order, variantId1 } = makeConfirmedOrderWithItems();

    await sut.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
      userId: USER_ID,
      itemOverrides: [
        {
          variantId: variantId1.toString(),
          receivedQuantity: 3,
          notes: 'Partial shipment',
        },
      ],
    });

    const calls = vi.mocked(mockRegisterItemEntry.execute).mock.calls;
    const overriddenCall = calls.find(
      (c: unknown[]) =>
        (c[0] as Record<string, unknown>).variantId === variantId1.toString(),
    );
    expect(overriddenCall![0].quantity).toBe(3);
    expect(overriddenCall![0].notes).toBe('Partial shipment');
  });

  it('should skip zero-quantity items in overrides', async () => {
    const { order, variantId1 } = makeConfirmedOrderWithItems();

    await sut.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
      userId: USER_ID,
      itemOverrides: [
        {
          variantId: variantId1.toString(),
          receivedQuantity: 0,
        },
      ],
    });

    // Should only create entry for the second item (variantId2 = 20 qty)
    expect(mockRegisterItemEntry.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw ResourceNotFoundError for nonexistent order', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'nonexistent-id',
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError for non-confirmed order', async () => {
    const order = makePurchaseOrder({ status: 'PENDING' });
    purchaseOrdersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: order.id.toString(),
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when all item entries fail', async () => {
    const { order } = makeConfirmedOrderWithItems();

    mockRegisterItemEntry.execute = vi
      .fn()
      .mockRejectedValue(new Error('Entry failed'));

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: order.id.toString(),
        userId: USER_ID,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should succeed with partial failures (some entries fail)', async () => {
    const { order } = makeConfirmedOrderWithItems();

    let callCount = 0;
    mockRegisterItemEntry.execute = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          item: { id: new UniqueEntityID().toString() },
          movement: { id: new UniqueEntityID().toString() },
        };
      }
      throw new Error('Entry failed');
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
      userId: USER_ID,
    });

    expect(result.entries).toHaveLength(1);
    expect(result.purchaseOrder.status).toBe('DELIVERED');
  });

  it('should remove calendar event if calendarSyncService is provided', async () => {
    const mockCalendarSync = {
      removeSystemEvent: vi.fn().mockResolvedValue(undefined),
    };

    sut = new ReceivePurchaseOrderUseCase(
      purchaseOrdersRepository,
      mockRegisterItemEntry,
      mockCalendarSync as any,
    );

    const { order } = makeConfirmedOrderWithItems();

    await sut.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
      userId: USER_ID,
    });

    expect(mockCalendarSync.removeSystemEvent).toHaveBeenCalledWith(
      'tenant-1',
      'STOCK_PO',
      order.id.toString(),
    );
  });
});
