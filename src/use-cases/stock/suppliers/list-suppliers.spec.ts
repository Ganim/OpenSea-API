import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSupplierUseCase } from './create-supplier';
import { ListSuppliersUseCase } from './list-suppliers';

let suppliersRepository: InMemorySuppliersRepository;
let createSupplierUseCase: CreateSupplierUseCase;
let sut: ListSuppliersUseCase;

describe('ListSuppliersUseCase', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    createSupplierUseCase = new CreateSupplierUseCase(suppliersRepository);
    sut = new ListSuppliersUseCase(suppliersRepository);
  });

  it('should list all suppliers', async () => {
    await createSupplierUseCase.execute({
      name: 'Tech Supplies Co.',
      city: 'São Paulo',
    });

    await createSupplierUseCase.execute({
      name: 'Office Supplies Ltd.',
      city: 'Rio de Janeiro',
    });

    const result = await sut.execute();

    expect(result.suppliers).toHaveLength(2);
    expect(result.suppliers[0].name).toBe('Tech Supplies Co.');
    expect(result.suppliers[1].name).toBe('Office Supplies Ltd.');
  });

  it('should return empty array when there are no suppliers', async () => {
    const result = await sut.execute();

    expect(result.suppliers).toHaveLength(0);
  });
});
