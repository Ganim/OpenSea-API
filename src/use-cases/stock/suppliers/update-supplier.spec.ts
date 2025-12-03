import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSupplierUseCase } from './create-supplier';
import { UpdateSupplierUseCase } from './update-supplier';

let suppliersRepository: InMemorySuppliersRepository;
let createSupplierUseCase: CreateSupplierUseCase;
let sut: UpdateSupplierUseCase;

describe('UpdateSupplierUseCase', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    createSupplierUseCase = new CreateSupplierUseCase(suppliersRepository);
    sut = new UpdateSupplierUseCase(suppliersRepository);
  });

  it('should update a supplier', async () => {
    const { supplier: createdSupplier } = await createSupplierUseCase.execute({
      name: 'Tech Supplies Co.',
      email: 'contact@techsupplies.com',
    });

    const result = await sut.execute({
      id: createdSupplier.id,
      name: 'Updated Tech Supplies Co.',
      email: 'newemail@techsupplies.com',
      rating: 5,
    });

    expect(result.supplier).toEqual(
      expect.objectContaining({
        name: 'Updated Tech Supplies Co.',
        email: 'newemail@techsupplies.com',
        rating: 5,
      }),
    );
  });

  it('should update only name', async () => {
    const { supplier: createdSupplier } = await createSupplierUseCase.execute({
      name: 'Tech Supplies Co.',
      email: 'contact@techsupplies.com',
    });

    const result = await sut.execute({
      id: createdSupplier.id,
      name: 'Updated Name',
    });

    expect(result.supplier.name).toBe('Updated Name');
    expect(result.supplier.email).toBe('contact@techsupplies.com');
  });

  it('should throw error when updating with empty name', async () => {
    const { supplier: createdSupplier } = await createSupplierUseCase.execute({
      name: 'Tech Supplies Co.',
    });

    await expect(
      sut.execute({
        id: createdSupplier.id,
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when updating with invalid email', async () => {
    const { supplier: createdSupplier } = await createSupplierUseCase.execute({
      name: 'Tech Supplies Co.',
    });

    await expect(
      sut.execute({
        id: createdSupplier.id,
        email: 'invalid-email',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when updating with invalid rating', async () => {
    const { supplier: createdSupplier } = await createSupplierUseCase.execute({
      name: 'Tech Supplies Co.',
    });

    await expect(
      sut.execute({
        id: createdSupplier.id,
        rating: 6,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw error when supplier does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
