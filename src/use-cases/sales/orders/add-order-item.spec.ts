import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeVariant } from '@/utils/tests/factories/stock/make-variant';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddOrderItemUseCase } from './add-order-item';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let variantsRepository: InMemoryVariantsRepository;
let sut: AddOrderItemUseCase;

const tenantId = 'tenant-1';

describe('Add Order Item', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    variantsRepository = new InMemoryVariantsRepository();

    sut = new AddOrderItemUseCase(
      ordersRepository,
      orderItemsRepository,
      variantsRepository,
    );
  });

  it('should add an item to a DRAFT order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 49.9,
    });
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      variantId: variant.id.toString(),
      quantity: 2,
    });

    expect(result.orderItem).toBeTruthy();
    expect(result.orderItem.name).toBe(variant.name);
    expect(result.orderItem.unitPrice).toBe(49.9);
    expect(result.orderItem.quantity).toBe(2);
    expect(result.order.subtotal).toBe(99.8);
    expect(orderItemsRepository.items).toHaveLength(1);
  });

  it('should merge quantity when variant already in cart', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 10,
    });
    variantsRepository.items.push(variant);

    // Add first time
    await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      variantId: variant.id.toString(),
      quantity: 2,
    });

    // Add again (should merge)
    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      variantId: variant.id.toString(),
      quantity: 3,
    });

    expect(result.orderItem.quantity).toBe(5);
    expect(result.order.subtotal).toBe(50);
    expect(orderItemsRepository.items).toHaveLength(1);
  });

  it('should default quantity to 1', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 25,
    });
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      variantId: variant.id.toString(),
    });

    expect(result.orderItem.quantity).toBe(1);
    expect(result.order.subtotal).toBe(25);
  });

  it('should allow adding items to PENDING order when isCashier is true', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
      price: 10,
    });
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      variantId: variant.id.toString(),
      isCashier: true,
    });

    expect(result.orderItem).toBeTruthy();
  });

  it('should reject adding items to CONFIRMED order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'CONFIRMED',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
    });
    variantsRepository.items.push(variant);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        variantId: variant.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject adding items to PENDING order without cashier flag', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
    });
    variantsRepository.items.push(variant);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        variantId: variant.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if order not found', async () => {
    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
    });
    variantsRepository.items.push(variant);

    await expect(
      sut.execute({
        tenantId,
        orderId: 'non-existing',
        variantId: variant.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if variant not found', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        variantId: 'non-existing',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if variant is inactive', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
    });
    variant.props.isActive = false;
    variantsRepository.items.push(variant);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        variantId: variant.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if quantity is zero or negative', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const variant = makeVariant({
      tenantId: new UniqueEntityID(tenantId),
    });
    variantsRepository.items.push(variant);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        variantId: variant.id.toString(),
        quantity: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
