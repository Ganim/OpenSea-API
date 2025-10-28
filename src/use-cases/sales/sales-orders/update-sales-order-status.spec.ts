import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySalesOrdersRepository } from '@/repositories/sales/in-memory/in-memory-sales-orders-repository';
import { makeSalesOrder } from '@/utils/tests/factories/sales/make-sales-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateSalesOrderStatusUseCase } from './update-sales-order-status';

let salesOrdersRepository: InMemorySalesOrdersRepository;
let sut: UpdateSalesOrderStatusUseCase;

describe('Update Sales Order Status', () => {
  beforeEach(() => {
    salesOrdersRepository = new InMemorySalesOrdersRepository();
    sut = new UpdateSalesOrderStatusUseCase(salesOrdersRepository);
  });

  it('should be able to update status from PENDING to CONFIRMED', async () => {
    const order = makeSalesOrder({
      status: 'PENDING',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    const result = await sut.execute({
      id: order.id.toString(),
      status: 'CONFIRMED',
    });

    expect(result.salesOrder.status).toBe('CONFIRMED');
  });

  it('should be able to update status from CONFIRMED to IN_TRANSIT', async () => {
    const order = makeSalesOrder({
      status: 'CONFIRMED',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    const result = await sut.execute({
      id: order.id.toString(),
      status: 'IN_TRANSIT',
    });

    expect(result.salesOrder.status).toBe('IN_TRANSIT');
  });

  it('should be able to update status from IN_TRANSIT to DELIVERED', async () => {
    const order = makeSalesOrder({
      status: 'IN_TRANSIT',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    const result = await sut.execute({
      id: order.id.toString(),
      status: 'DELIVERED',
    });

    expect(result.salesOrder.status).toBe('DELIVERED');
  });

  it('should be able to update status from DRAFT to PENDING', async () => {
    const order = makeSalesOrder({
      status: 'DRAFT',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    const result = await sut.execute({
      id: order.id.toString(),
      status: 'PENDING',
    });

    expect(result.salesOrder.status).toBe('PENDING');
  });

  it('should not be able to update status of non-existing order', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
        status: 'CONFIRMED',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to update status from PENDING to IN_TRANSIT', async () => {
    const order = makeSalesOrder({
      status: 'PENDING',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    await expect(() =>
      sut.execute({
        id: order.id.toString(),
        status: 'IN_TRANSIT',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update status from DRAFT to IN_TRANSIT', async () => {
    const order = makeSalesOrder({
      status: 'DRAFT',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    await expect(() =>
      sut.execute({
        id: order.id.toString(),
        status: 'IN_TRANSIT',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update status of a cancelled order', async () => {
    const order = makeSalesOrder({
      status: 'CANCELLED',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    await expect(() =>
      sut.execute({
        id: order.id.toString(),
        status: 'PENDING',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update status of a delivered order', async () => {
    const order = makeSalesOrder({
      status: 'DELIVERED',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    await expect(() =>
      sut.execute({
        id: order.id.toString(),
        status: 'PENDING',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
