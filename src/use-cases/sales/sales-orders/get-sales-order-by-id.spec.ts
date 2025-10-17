import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySalesOrdersRepository } from '@/repositories/sales/in-memory/in-memory-sales-orders-repository';
import { makeSalesOrder } from '@/utils/tests/factories/sales/make-sales-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSalesOrderByIdUseCase } from './get-sales-order-by-id';

let salesOrdersRepository: InMemorySalesOrdersRepository;
let sut: GetSalesOrderByIdUseCase;

describe('Get Sales Order By Id', () => {
  beforeEach(() => {
    salesOrdersRepository = new InMemorySalesOrdersRepository();
    sut = new GetSalesOrderByIdUseCase(salesOrdersRepository);
  });

  it('should be able to get a sales order by id', async () => {
    const order = makeSalesOrder({
      orderNumber: 'SO-2024-001',
      items: [
        { quantity: 2, unitPrice: 100 },
        { quantity: 1, unitPrice: 50 },
      ],
    });
    salesOrdersRepository.items.push(order);

    const result = await sut.execute({
      id: order.id.toString(),
    });

    expect(result.order).toEqual(
      expect.objectContaining({
        id: order.id.toString(),
        orderNumber: 'SO-2024-001',
        status: 'PENDING',
      }),
    );
    expect(result.order.items).toHaveLength(2);
  });

  it('should not be able to get a non-existing sales order', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
