import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSupplierUseCase } from './create-supplier';
import { GetSupplierByIdUseCase } from './get-supplier-by-id';

let suppliersRepository: InMemorySuppliersRepository;
let createSupplierUseCase: CreateSupplierUseCase;
let sut: GetSupplierByIdUseCase;

describe('GetSupplierByIdUseCase', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    createSupplierUseCase = new CreateSupplierUseCase(suppliersRepository);
    sut = new GetSupplierByIdUseCase(suppliersRepository);
  });

  it('should get a supplier by id', async () => {
    const { supplier: createdSupplier } = await createSupplierUseCase.execute({
      name: 'Tech Supplies Co.',
      email: 'contact@techsupplies.com',
      city: 'São Paulo',
    });

    const result = await sut.execute({
      id: createdSupplier.id,
    });

    expect(result.supplier).toEqual(createdSupplier);
  });

  it('should throw error when supplier does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
