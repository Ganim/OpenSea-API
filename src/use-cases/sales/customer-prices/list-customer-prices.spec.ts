import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCustomerPricesRepository } from '@/repositories/sales/in-memory/in-memory-customer-prices-repository';
import { makeCustomerPrice } from '@/utils/tests/factories/sales/make-customer-price';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCustomerPricesUseCase } from './list-customer-prices';

let customerPricesRepository: InMemoryCustomerPricesRepository;
let sut: ListCustomerPricesUseCase;

describe('List Customer Prices', () => {
  beforeEach(() => {
    customerPricesRepository = new InMemoryCustomerPricesRepository();
    sut = new ListCustomerPricesUseCase(customerPricesRepository);
  });

  it('should be able to list prices by customer', async () => {
    const customerId = new UniqueEntityID('customer-1');

    customerPricesRepository.items.push(
      makeCustomerPrice({ customerId, price: 100 }),
      makeCustomerPrice({ customerId, price: 200 }),
      makeCustomerPrice({
        customerId: new UniqueEntityID('customer-2'),
        price: 300,
      }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
    });

    expect(result.customerPrices).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});
