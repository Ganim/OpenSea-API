import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateCustomerUseCase } from './update-customer';

let customersRepository: InMemoryCustomersRepository;
let sut: UpdateCustomerUseCase;

describe('Update Customer', () => {
  beforeEach(() => {
    customersRepository = new InMemoryCustomersRepository();
    sut = new UpdateCustomerUseCase(customersRepository);
  });

  it('should be able to update a customer', async () => {
    const customer = makeCustomer({
      name: 'John Doe',
      email: 'john@example.com',
    });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      id: customer.id.toString(),
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '1234567890',
    });

    expect(result.customer).toEqual(
      expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '1234567890',
      }),
    );
    expect(customersRepository.items[0].name).toBe('Jane Doe');
  });

  it('should be able to update customer type', async () => {
    const customer = makeCustomer({
      type: 'INDIVIDUAL',
    });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      id: customer.id.toString(),
      type: 'BUSINESS',
    });

    expect(result.customer.type).toBe('BUSINESS');
  });

  it('should be able to update customer document', async () => {
    const customer = makeCustomer({
      document: '52998224725', // valid CPF
    });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      id: customer.id.toString(),
      document: '11222333000181', // valid CNPJ
    });

    expect(result.customer.document).toBe('11222333000181');
  });

  it('should be able to remove optional fields', async () => {
    const customer = makeCustomer({
      email: 'john@example.com',
      phone: '1234567890',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      notes: 'Some notes',
    });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      id: customer.id.toString(),
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      notes: '',
    });

    expect(result.customer.email).toBeUndefined();
    expect(result.customer.phone).toBeUndefined();
    expect(result.customer.address).toBeUndefined();
    expect(result.customer.city).toBeUndefined();
    expect(result.customer.state).toBeUndefined();
    expect(result.customer.zipCode).toBeUndefined();
    expect(result.customer.country).toBeUndefined();
    expect(result.customer.notes).toBeUndefined();
  });

  it('should be able to deactivate customer', async () => {
    const customer = makeCustomer({
      isActive: true,
    });
    customersRepository.items.push(customer);

    const result = await sut.execute({
      id: customer.id.toString(),
      isActive: false,
    });

    expect(result.customer.isActive).toBe(false);
  });

  it('should convert state to uppercase', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const result = await sut.execute({
      id: customer.id.toString(),
      state: 'sp',
    });

    expect(result.customer.state).toBe('SP');
  });

  it('should trim customer name', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    const result = await sut.execute({
      id: customer.id.toString(),
      name: '  John Doe  ',
    });

    expect(result.customer.name).toBe('John Doe');
  });

  it('should not be able to update a non-existing customer', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
        name: 'John Doe',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to update customer with empty name', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    await expect(() =>
      sut.execute({
        id: customer.id.toString(),
        name: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update customer with name exceeding 128 characters', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    await expect(() =>
      sut.execute({
        id: customer.id.toString(),
        name: 'a'.repeat(129),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update customer with invalid email', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    await expect(() =>
      sut.execute({
        id: customer.id.toString(),
        email: 'invalid-email',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update customer with duplicate email', async () => {
    const customer1 = makeCustomer({
      email: 'john@example.com',
    });
    const customer2 = makeCustomer({
      email: 'jane@example.com',
    });
    customersRepository.items.push(customer1);
    customersRepository.items.push(customer2);

    await expect(() =>
      sut.execute({
        id: customer2.id.toString(),
        email: 'john@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update customer with duplicate document', async () => {
    const customer1 = makeCustomer({
      document: '52998224725', // valid CPF
    });
    const customer2 = makeCustomer({
      document: '11222333000181', // valid CNPJ
    });
    customersRepository.items.push(customer1);
    customersRepository.items.push(customer2);

    await expect(() =>
      sut.execute({
        id: customer2.id.toString(),
        document: '52998224725',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update customer with invalid document', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    await expect(() =>
      sut.execute({
        id: customer.id.toString(),
        document: '12345678900', // invalid CPF
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not be able to update customer with invalid state length', async () => {
    const customer = makeCustomer();
    customersRepository.items.push(customer);

    await expect(() =>
      sut.execute({
        id: customer.id.toString(),
        state: 'ABC',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
