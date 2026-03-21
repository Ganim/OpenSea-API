import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCustomerPricesRepository } from '@/repositories/sales/in-memory/in-memory-customer-prices-repository';
import { makeCustomerPrice } from '@/utils/tests/factories/sales/make-customer-price';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateCustomerPriceUseCase } from './update-customer-price';

let customerPricesRepository: InMemoryCustomerPricesRepository;
let sut: UpdateCustomerPriceUseCase;

describe('Update Customer Price', () => {
  beforeEach(() => {
    customerPricesRepository = new InMemoryCustomerPricesRepository();
    sut = new UpdateCustomerPriceUseCase(customerPricesRepository);
  });

  it('should be able to update a customer price', async () => {
    const customerPrice = makeCustomerPrice({ price: 100 });
    customerPricesRepository.items.push(customerPrice);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: customerPrice.id.toString(),
      price: 75,
      notes: 'Negotiated discount',
    });

    expect(result.customerPrice.price).toBe(75);
    expect(result.customerPrice.notes).toBe('Negotiated discount');
  });

  it('should not be able to update a non-existing customer price', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existing-id',
        price: 50,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
