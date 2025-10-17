import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySalesOrdersRepository } from '@/repositories/sales/in-memory/in-memory-sales-orders-repository';
import { makeSalesOrder } from '@/utils/tests/factories/sales/make-sales-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelSalesOrderUseCase } from './cancel-sales-order';

let salesOrdersRepository: InMemorySalesOrdersRepository;
let sut: CancelSalesOrderUseCase;

describe('Cancel Sales Order', () => {
  beforeEach(() => {
    salesOrdersRepository = new InMemorySalesOrdersRepository();
    sut = new CancelSalesOrderUseCase(salesOrdersRepository);
  });

  it('should be able to cancel a pending sales order', async () => {
    const order = makeSalesOrder({
      status: 'PENDING',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    await sut.execute({
      id: order.id.toString(),
    });

    const cancelledOrder = salesOrdersRepository.items.find((o) =>
      o.id.equals(order.id),
    );
    expect(cancelledOrder?.status.value).toBe('CANCELLED');
  });

  it('should be able to cancel a confirmed sales order', async () => {
    const order = makeSalesOrder({
      status: 'CONFIRMED',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    await sut.execute({
      id: order.id.toString(),
    });

    const cancelledOrder = salesOrdersRepository.items.find((o) =>
      o.id.equals(order.id),
    );
    expect(cancelledOrder?.status.value).toBe('CANCELLED');
  });

  it('should not be able to cancel a non-existing sales order', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to cancel an already cancelled sales order', async () => {
    const order = makeSalesOrder({
      status: 'CANCELLED',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    await expect(() =>
      sut.execute({
        id: order.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to cancel a delivered sales order', async () => {
    const order = makeSalesOrder({
      status: 'DELIVERED',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    salesOrdersRepository.items.push(order);

    await expect(() =>
      sut.execute({
        id: order.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
