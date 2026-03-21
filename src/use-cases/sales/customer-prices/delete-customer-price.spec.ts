import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCustomerPricesRepository } from '@/repositories/sales/in-memory/in-memory-customer-prices-repository';
import { makeCustomerPrice } from '@/utils/tests/factories/sales/make-customer-price';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteCustomerPriceUseCase } from './delete-customer-price';

let customerPricesRepository: InMemoryCustomerPricesRepository;
let sut: DeleteCustomerPriceUseCase;

describe('Delete Customer Price', () => {
  beforeEach(() => {
    customerPricesRepository = new InMemoryCustomerPricesRepository();
    sut = new DeleteCustomerPriceUseCase(customerPricesRepository);
  });

  it('should be able to delete a customer price', async () => {
    const customerPrice = makeCustomerPrice();
    customerPricesRepository.items.push(customerPrice);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: customerPrice.id.toString(),
    });

    expect(result.message).toBe('Customer price deleted successfully.');
    expect(customerPricesRepository.items).toHaveLength(0);
  });

  it('should not be able to delete a non-existing customer price', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existing-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
