import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySuppliersRepository } from '@/repositories/hr/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateSupplierUseCase } from './update-supplier';

let suppliersRepository: InMemorySuppliersRepository;
let sut: UpdateSupplierUseCase;

describe('Update Supplier Use Case', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    sut = new UpdateSupplierUseCase(suppliersRepository);
  });

  it('should update a supplier', async () => {
    const supplier = await suppliersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor ABC LTDA',
      cnpj: '12345678000100',
    });

    const result = await sut.execute({
      id: supplier.id.toString(),
      legalName: 'Fornecedor ABC Atualizado LTDA',
      tradeName: 'ABC Atualizado',
    });

    expect(result.supplier).toBeDefined();
    expect(result.supplier.legalName).toBe('Fornecedor ABC Atualizado LTDA');
    expect(result.supplier.tradeName).toBe('ABC Atualizado');
  });

  it('should throw ResourceNotFoundError when not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        legalName: 'Nome Novo',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when rating is greater than 5', async () => {
    const supplier = await suppliersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor ABC LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      sut.execute({
        id: supplier.id.toString(),
        rating: 6,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when rating is less than 0', async () => {
    const supplier = await suppliersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor ABC LTDA',
      cnpj: '12345678000100',
    });

    await expect(
      sut.execute({
        id: supplier.id.toString(),
        rating: -1,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
