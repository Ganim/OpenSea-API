import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { InMemorySalesOrdersRepository } from '@/repositories/sales/in-memory/in-memory-sales-orders-repository';
import { InMemoryVariantsRepository } from '@/repositories/stock/in-memory/in-memory-variants-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { makeVariant } from '@/utils/tests/factories/stock/make-variant';

import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSalesOrderUseCase } from './create-sales-order';

let salesOrdersRepository: InMemorySalesOrdersRepository;
let customersRepository: InMemoryCustomersRepository;
let variantsRepository: InMemoryVariantsRepository;
let sut: CreateSalesOrderUseCase;

describe('Create Sales Order', () => {
  beforeEach(() => {
    salesOrdersRepository = new InMemorySalesOrdersRepository();
    customersRepository = new InMemoryCustomersRepository();
    variantsRepository = new InMemoryVariantsRepository();
    sut = new CreateSalesOrderUseCase(
      salesOrdersRepository,
      customersRepository,
      variantsRepository,
    );
  });

  it('should be able to create a sales order with items', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant1 = makeVariant();
    const variant2 = makeVariant();
    variantsRepository.items.push(variant1);
    variantsRepository.items.push(variant2);

    const result = await sut.execute({
      orderNumber: 'SO-2024-001',
      customerId: customer.id.toString(),
      items: [
        {
          variantId: variant1.id.toString(),
          quantity: 2,
          unitPrice: 100,
        },
        {
          variantId: variant2.id.toString(),
          quantity: 1,
          unitPrice: 50,
          discount: 10,
        },
      ],
    });

    expect(result.order).toEqual(
      expect.objectContaining({
        orderNumber: 'SO-2024-001',
        status: 'PENDING',
        customerId: customer.id.toString(),
        totalPrice: 240, // (2 * 100) + (1 * 50 - 10)
        discount: 0,
        finalPrice: 240,
      }),
    );
    expect(result.order.items).toHaveLength(2);
    expect(result.order.items[0]).toEqual(
      expect.objectContaining({
        quantity: 2,
        unitPrice: 100,
        discount: 0,
        totalPrice: 200,
      }),
    );
    expect(result.order.items[1]).toEqual(
      expect.objectContaining({
        quantity: 1,
        unitPrice: 50,
        discount: 10,
        totalPrice: 40,
      }),
    );
  });

  it('should be able to create a sales order with order discount', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      orderNumber: 'SO-2024-002',
      customerId: customer.id.toString(),
      discount: 50,
      items: [
        {
          variantId: variant.id.toString(),
          quantity: 2,
          unitPrice: 100,
        },
      ],
    });

    expect(result.order.totalPrice).toBe(200);
    expect(result.order.discount).toBe(50);
    expect(result.order.finalPrice).toBe(150);
  });

  it('should be able to create a sales order with status DRAFT', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      orderNumber: 'SO-2024-003',
      customerId: customer.id.toString(),
      status: 'DRAFT',
      items: [
        {
          variantId: variant.id.toString(),
          quantity: 1,
          unitPrice: 100,
        },
      ],
    });

    expect(result.order.status).toBe('DRAFT');
  });

  it('should be able to create a sales order with notes', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    const result = await sut.execute({
      orderNumber: 'SO-2024-004',
      customerId: customer.id.toString(),
      notes: 'Important order',
      items: [
        {
          variantId: variant.id.toString(),
          quantity: 1,
          unitPrice: 100,
          notes: 'Item note',
        },
      ],
    });

    expect(result.order.notes).toBe('Important order');
    expect(result.order.items[0].notes).toBe('Item note');
  });

  it('should not be able to create a sales order without order number', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    await expect(() =>
      sut.execute({
        orderNumber: '',
        customerId: customer.id.toString(),
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 1,
            unitPrice: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a sales order with duplicate order number', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    await sut.execute({
      orderNumber: 'SO-2024-001',
      customerId: customer.id.toString(),
      items: [
        {
          variantId: variant.id.toString(),
          quantity: 1,
          unitPrice: 100,
        },
      ],
    });

    await expect(() =>
      sut.execute({
        orderNumber: 'SO-2024-001',
        customerId: customer.id.toString(),
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 1,
            unitPrice: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a sales order with non-existing customer', async () => {
    const variant = makeVariant();
    variantsRepository.items.push(variant);

    await expect(() =>
      sut.execute({
        orderNumber: 'SO-2024-001',
        customerId: 'non-existing-id',
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 1,
            unitPrice: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to create a sales order without items', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    await expect(() =>
      sut.execute({
        orderNumber: 'SO-2024-001',
        customerId: customer.id.toString(),
        items: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a sales order with non-existing variant', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    await expect(() =>
      sut.execute({
        orderNumber: 'SO-2024-001',
        customerId: customer.id.toString(),
        items: [
          {
            variantId: 'non-existing-variant-id',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to create a sales order with item quantity zero or negative', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    await expect(() =>
      sut.execute({
        orderNumber: 'SO-2024-001',
        customerId: customer.id.toString(),
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 0,
            unitPrice: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a sales order with negative unit price', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    await expect(() =>
      sut.execute({
        orderNumber: 'SO-2024-001',
        customerId: customer.id.toString(),
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 1,
            unitPrice: -100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a sales order with negative discount', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    await expect(() =>
      sut.execute({
        orderNumber: 'SO-2024-001',
        customerId: customer.id.toString(),
        discount: -50,
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 1,
            unitPrice: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to create a sales order with order number exceeding 50 characters', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const variant = makeVariant();
    variantsRepository.items.push(variant);

    await expect(() =>
      sut.execute({
        orderNumber: 'A'.repeat(51),
        customerId: customer.id.toString(),
        items: [
          {
            variantId: variant.id.toString(),
            quantity: 1,
            unitPrice: 100,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
