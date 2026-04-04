import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPosTransactionPaymentsRepository } from '@/repositories/sales/in-memory/in-memory-pos-transaction-payments-repository';
import { InMemoryPosTransactionsRepository } from '@/repositories/sales/in-memory/in-memory-pos-transactions-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeOrderItem } from '@/utils/tests/factories/sales/make-order-item';
import { makeVariant } from '@/utils/tests/factories/stock/make-variant';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReceivePaymentUseCase } from './receive-payment';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let posTransactionsRepository: InMemoryPosTransactionsRepository;
let posTransactionPaymentsRepository: InMemoryPosTransactionPaymentsRepository;
let sut: ReceivePaymentUseCase;

const tenantId = 'tenant-1';

describe('Receive Payment', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    variantsRepository = new InMemoryVariantsRepository();
    posTransactionsRepository = new InMemoryPosTransactionsRepository();
    posTransactionPaymentsRepository =
      new InMemoryPosTransactionPaymentsRepository();

    sut = new ReceivePaymentUseCase(
      ordersRepository,
      orderItemsRepository,
      variantsRepository,
      posTransactionsRepository,
      posTransactionPaymentsRepository,
    );
  });

  it('should process a cash payment and confirm the order', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 50,
    });
    variantsRepository.items.push(variant);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      subtotal: 100,
      grandTotal: 100,
      assignedToUserId: new UniqueEntityID('seller-1'),
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      variantId: variant.id,
      unitPrice: 50,
      quantity: 2,
    });
    orderItemsRepository.items.push(item);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId: 'cashier-1',
      terminalMode: 'STANDARD',
      posSessionId: 'session-1',
      expectedVersion: 1,
      payments: [
        { method: 'CASH', amount: 100, receivedAmount: 120 },
      ],
    });

    expect(result.order.status).toBe('CONFIRMED');
    expect(result.order.version).toBe(2);
    expect(result.changeAmount).toBe(20);
    expect(result.posTransaction).toBeTruthy();
    expect(result.posTransaction.grandTotal).toBe(100);
    expect(posTransactionsRepository.items).toHaveLength(1);
    expect(posTransactionPaymentsRepository.items).toHaveLength(1);
  });

  it('should process split payment (card + cash)', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 75,
    });
    variantsRepository.items.push(variant);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      subtotal: 150,
      grandTotal: 150,
      assignedToUserId: new UniqueEntityID('seller-1'),
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      variantId: variant.id,
      unitPrice: 75,
      quantity: 2,
    });
    orderItemsRepository.items.push(item);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId: 'cashier-1',
      terminalMode: 'STANDARD',
      expectedVersion: 1,
      payments: [
        { method: 'CREDIT_CARD', amount: 100, installments: 2 },
        { method: 'CASH', amount: 50, receivedAmount: 60 },
      ],
    });

    expect(result.order.status).toBe('CONFIRMED');
    expect(result.changeAmount).toBe(10);
    expect(posTransactionPaymentsRepository.items).toHaveLength(2);
  });

  it('should throw if payment total is less than order total', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 100,
    });
    variantsRepository.items.push(variant);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 100,
      grandTotal: 100,
      assignedToUserId: new UniqueEntityID('seller-1'),
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      variantId: variant.id,
      unitPrice: 100,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [{ method: 'CASH', amount: 50 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ConflictError on version mismatch', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 100,
      grandTotal: 100,
      version: 2,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 100,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [{ method: 'CASH', amount: 100 }],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should throw if order not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        orderId: 'non-existing',
        userId: 'cashier-1',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [{ method: 'CASH', amount: 100 }],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if order has no items', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 100,
      grandTotal: 100,
      version: 1,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [{ method: 'CASH', amount: 100 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if no payments provided', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 100,
      grandTotal: 100,
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 100,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if payment amount is zero or negative', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 100,
      grandTotal: 100,
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 100,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [{ method: 'CASH', amount: 0 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if non-cash payment exceeds remaining amount', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 100,
    });
    variantsRepository.items.push(variant);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 100,
      grandTotal: 100,
      assignedToUserId: new UniqueEntityID('seller-1'),
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      variantId: variant.id,
      unitPrice: 100,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [{ method: 'CREDIT_CARD', amount: 150 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should enforce separation of duties in STANDARD mode', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 50,
    });
    variantsRepository.items.push(variant);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 50,
      grandTotal: 50,
      assignedToUserId: new UniqueEntityID('same-user'),
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      variantId: variant.id,
      unitPrice: 50,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'same-user',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [{ method: 'CASH', amount: 50 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should skip separation of duties in FAST_CHECKOUT mode', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 50,
    });
    variantsRepository.items.push(variant);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 50,
      grandTotal: 50,
      assignedToUserId: new UniqueEntityID('same-user'),
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      variantId: variant.id,
      unitPrice: 50,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId: 'same-user',
      terminalMode: 'FAST_CHECKOUT',
      expectedVersion: 1,
      payments: [{ method: 'CASH', amount: 50 }],
    });

    expect(result.order.status).toBe('CONFIRMED');
  });

  it('should skip separation of duties with override permission', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 50,
    });
    variantsRepository.items.push(variant);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 50,
      grandTotal: 50,
      assignedToUserId: new UniqueEntityID('same-user'),
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      variantId: variant.id,
      unitPrice: 50,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId: 'same-user',
      terminalMode: 'STANDARD',
      expectedVersion: 1,
      hasOverridePermission: true,
      payments: [{ method: 'CASH', amount: 50 }],
    });

    expect(result.order.status).toBe('CONFIRMED');
  });

  it('should throw if variant is inactive', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 50,
    });
    variant.props.isActive = false;
    variantsRepository.items.push(variant);

    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 50,
      grandTotal: 50,
      version: 1,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      variantId: variant.id,
      unitPrice: 50,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
        terminalMode: 'FAST_CHECKOUT',
        expectedVersion: 1,
        payments: [{ method: 'CASH', amount: 50 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if order is already CONFIRMED', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'CONFIRMED',
      subtotal: 100,
      grandTotal: 100,
      version: 1,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
        terminalMode: 'STANDARD',
        expectedVersion: 1,
        payments: [{ method: 'CASH', amount: 100 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
