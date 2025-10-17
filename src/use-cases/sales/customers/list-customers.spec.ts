import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { makeCustomer } from '@/utils/tests/factories/sales/make-customer';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCustomersUseCase } from './list-customers';

let customersRepository: InMemoryCustomersRepository;
let sut: ListCustomersUseCase;

describe('List Customers', () => {
  beforeEach(() => {
    customersRepository = new InMemoryCustomersRepository();
    sut = new ListCustomersUseCase(customersRepository);
  });

  it('should be able to list all customers', async () => {
    customersRepository.items.push(
      makeCustomer({ name: 'Customer 1', type: 'INDIVIDUAL' }),
    );
    customersRepository.items.push(
      makeCustomer({ name: 'Customer 2', type: 'BUSINESS' }),
    );

    const result = await sut.execute({});

    expect(result.customers).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should be able to list only active customers', async () => {
    customersRepository.items.push(
      makeCustomer({ name: 'Active', isActive: true }),
    );
    customersRepository.items.push(
      makeCustomer({ name: 'Inactive', isActive: false }),
    );

    const result = await sut.execute({ isActive: true });

    expect(result.customers).toHaveLength(1);
    expect(result.customers[0].name).toBe('Active');
  });

  it('should be able to list customers by type', async () => {
    customersRepository.items.push(makeCustomer({ type: 'INDIVIDUAL' }));
    customersRepository.items.push(makeCustomer({ type: 'INDIVIDUAL' }));
    customersRepository.items.push(makeCustomer({ type: 'BUSINESS' }));

    const result = await sut.execute({ type: 'INDIVIDUAL' });

    expect(result.customers).toHaveLength(2);
    expect(result.customers[0].type).toBe('INDIVIDUAL');
    expect(result.customers[1].type).toBe('INDIVIDUAL');
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 25; i++) {
      customersRepository.items.push(makeCustomer({ name: `Customer ${i}` }));
    }

    const page1 = await sut.execute({ page: 1, perPage: 10 });
    const page2 = await sut.execute({ page: 2, perPage: 10 });

    expect(page1.customers).toHaveLength(10);
    expect(page2.customers).toHaveLength(10);
    expect(page1.totalPages).toBe(3);
  });
});
