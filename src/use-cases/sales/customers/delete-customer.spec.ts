import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteCustomerUseCase } from './delete-customer';

let customersRepository: InMemoryCustomersRepository;
let sut: DeleteCustomerUseCase;

describe('Delete Customer', () => {
  beforeEach(() => {
    customersRepository = new InMemoryCustomersRepository();
    sut = new DeleteCustomerUseCase(customersRepository);
  });

  it('should be able to delete a customer (soft delete)', async () => {
    const customer = makeCustomer({
      name: 'John Doe',
    });
    customersRepository.items.push(customer);

    await sut.execute({
      tenantId: 'tenant-1',
      id: customer.id.toString(),
    });

    const deletedCustomer = customersRepository.items.find((c) =>
      c.id.equals(customer.id),
    );
    expect(deletedCustomer?.deletedAt).toBeInstanceOf(Date);
  });

  it('should not be able to delete a non-existing customer', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
