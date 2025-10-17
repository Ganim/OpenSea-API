import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCustomerByIdUseCase } from './get-customer-by-id';

let customersRepository: InMemoryCustomersRepository;
let sut: GetCustomerByIdUseCase;

describe('Get Customer By Id', () => {
  beforeEach(() => {
    customersRepository = new InMemoryCustomersRepository();
    sut = new GetCustomerByIdUseCase(customersRepository);
  });

  it('should be able to get a customer by id', async () => {
    const customer = makeCustomer({
      name: 'John Doe',
      email: 'john@example.com',
    });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      id: customer.id.toString(),
    });

    expect(result.customer).toEqual(
      expect.objectContaining({
        id: customer.id.toString(),
        name: 'John Doe',
        email: 'john@example.com',
      }),
    );
  });

  it('should not be able to get a non-existing customer', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
