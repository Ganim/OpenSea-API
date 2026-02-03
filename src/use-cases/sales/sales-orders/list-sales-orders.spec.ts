import { InMemorySalesOrdersRepository } from '@/repositories/sales/in-memory/in-memory-sales-orders-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { makeSalesOrder } from '@/utils/tests/factories/sales/make-sales-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSalesOrdersUseCase } from './list-sales-orders';

let salesOrdersRepository: InMemorySalesOrdersRepository;
let sut: ListSalesOrdersUseCase;

describe('List Sales Orders', () => {
  beforeEach(() => {
    salesOrdersRepository = new InMemorySalesOrdersRepository();
    sut = new ListSalesOrdersUseCase(salesOrdersRepository);
  });

  it('should be able to list sales orders by customer', async () => {
    const customer1 = makeCustomer();
    const customer2 = makeCustomer();

    const order1 = makeSalesOrder({
      customerId: customer1.id.toString(),
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    const order2 = makeSalesOrder({
      customerId: customer1.id.toString(),
      items: [{ quantity: 1, unitPrice: 200 }],
    });
    const order3 = makeSalesOrder({
      customerId: customer2.id.toString(),
      items: [{ quantity: 1, unitPrice: 300 }],
    });

    salesOrdersRepository.items.push(order1);
    salesOrdersRepository.items.push(order2);
    salesOrdersRepository.items.push(order3);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: customer1.id.toString(),
    });

    expect(result.salesOrders).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.salesOrders[0].customerId).toBe(customer1.id.toString());
    expect(result.salesOrders[1].customerId).toBe(customer1.id.toString());
  });

  it('should be able to list sales orders by status', async () => {
    const order1 = makeSalesOrder({
      status: 'PENDING',
      items: [{ quantity: 1, unitPrice: 100 }],
    });
    const order2 = makeSalesOrder({
      status: 'PENDING',
      items: [{ quantity: 1, unitPrice: 200 }],
    });
    const order3 = makeSalesOrder({
      status: 'CONFIRMED',
      items: [{ quantity: 1, unitPrice: 300 }],
    });

    salesOrdersRepository.items.push(order1);
    salesOrdersRepository.items.push(order2);
    salesOrdersRepository.items.push(order3);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'PENDING',
    });

    expect(result.salesOrders).toHaveLength(2);
    expect(result.salesOrders[0].status).toBe('PENDING');
    expect(result.salesOrders[1].status).toBe('PENDING');
  });

  it('should paginate results', async () => {
    const customer = makeCustomer();

    for (let i = 1; i <= 25; i++) {
      const order = makeSalesOrder({
        customerId: customer.id.toString(),
        items: [{ quantity: 1, unitPrice: 100 }],
      });
      salesOrdersRepository.items.push(order);
    }

    const page1 = await sut.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
      page: 1,
      perPage: 10,
    });

    const page2 = await sut.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
      page: 2,
      perPage: 10,
    });

    expect(page1.salesOrders).toHaveLength(10);
    expect(page2.salesOrders).toHaveLength(10);
    expect(page1.totalPages).toBe(3);
    expect(page1.total).toBe(25);
  });
});
