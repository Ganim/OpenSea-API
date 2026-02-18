import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySuppliersRepository } from '@/repositories/hr/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteSupplierUseCase } from './delete-supplier';

let suppliersRepository: InMemorySuppliersRepository;
let sut: DeleteSupplierUseCase;

describe('Delete Supplier Use Case', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    sut = new DeleteSupplierUseCase(suppliersRepository);
  });

  it('should delete a supplier', async () => {
    const supplier = await suppliersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor ABC LTDA',
      cnpj: '12345678000100',
    });

    const result = await sut.execute({
      id: supplier.id.toString(),
    });

    expect(result.success).toBe(true);

    const found = await suppliersRepository.findById(supplier.id);
    expect(found).toBeNull();
  });

  it('should throw ResourceNotFoundError when supplier not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
