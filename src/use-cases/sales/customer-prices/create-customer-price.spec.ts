import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCustomerPricesRepository } from '@/repositories/sales/in-memory/in-memory-customer-prices-repository';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCustomerPriceUseCase } from './create-customer-price';

let customerPricesRepository: InMemoryCustomerPricesRepository;
let customersRepository: InMemoryCustomersRepository;
let sut: CreateCustomerPriceUseCase;

describe('Create Customer Price', () => {
  beforeEach(() => {
    customerPricesRepository = new InMemoryCustomerPricesRepository();
    customersRepository = new InMemoryCustomersRepository();
    sut = new CreateCustomerPriceUseCase(
      customerPricesRepository,
      customersRepository,
    );
  });

  it('should be able to create a customer price', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
      variantId: 'variant-1',
      price: 49.9,
      createdByUserId: 'user-1',
    });

    expect(result.customerPrice).toBeTruthy();
    expect(result.customerPrice.price).toBe(49.9);
    expect(customerPricesRepository.items).toHaveLength(1);
  });

  it('should not be able to create a price for non-existing customer', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        customerId: 'non-existing-id',
        variantId: 'variant-1',
        price: 49.9,
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to create a duplicate customer price', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    await sut.execute({
      tenantId: 'tenant-1',
      customerId: customer.id.toString(),
      variantId: 'variant-1',
      price: 49.9,
      createdByUserId: 'user-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        customerId: customer.id.toString(),
        variantId: 'variant-1',
        price: 39.9,
        createdByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
