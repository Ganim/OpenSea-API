import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySuppliersRepository } from '@/repositories/hr/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSupplierByIdUseCase } from './get-supplier-by-id';

let suppliersRepository: InMemorySuppliersRepository;
let sut: GetSupplierByIdUseCase;

describe('Get Supplier By Id Use Case', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    sut = new GetSupplierByIdUseCase(suppliersRepository);
  });

  it('should get a supplier by id', async () => {
    const supplier = await suppliersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor ABC LTDA',
      cnpj: '12345678000100',
    });

    const result = await sut.execute({
      id: supplier.id.toString(),
    });

    expect(result.supplier).toBeDefined();
    expect(result.supplier.legalName).toBe('Fornecedor ABC LTDA');
    expect(result.supplier.cnpj).toBe('12345678000100');
  });

  it('should throw ResourceNotFoundError when not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
