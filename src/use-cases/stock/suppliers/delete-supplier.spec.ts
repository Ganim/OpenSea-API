import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSupplierUseCase } from './create-supplier';
import { DeleteSupplierUseCase } from './delete-supplier';

let suppliersRepository: InMemorySuppliersRepository;
let createSupplierUseCase: CreateSupplierUseCase;
let sut: DeleteSupplierUseCase;

describe('DeleteSupplierUseCase', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    createSupplierUseCase = new CreateSupplierUseCase(suppliersRepository);
    sut = new DeleteSupplierUseCase(suppliersRepository);
  });

  it('should delete a supplier', async () => {
    const { supplier: createdSupplier } = await createSupplierUseCase.execute({
      name: 'Tech Supplies Co.',
    });

    await sut.execute({
      id: createdSupplier.id,
    });

    const deletedSupplier = await suppliersRepository.findById(
      new UniqueEntityID(createdSupplier.id),
    );
    expect(deletedSupplier).toBeNull();
  });

  it('should throw error when supplier does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
