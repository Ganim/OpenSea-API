import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemorySuppliersRepository } from '@/repositories/stock/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSupplierUseCase } from './create-supplier';

let suppliersRepository: InMemorySuppliersRepository;
let sut: CreateSupplierUseCase;

describe('CreateSupplierUseCase', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    sut = new CreateSupplierUseCase(suppliersRepository);
  });

  it('should create a supplier', async () => {
    const result = await sut.execute({
      name: 'Tech Supplies Co.',
      cnpj: '11.222.333/0001-81',
      email: 'contact@techsupplies.com',
      phone: '(11) 1234-5678',
      city: 'São Paulo',
      state: 'SP',
    });

    expect(result.supplier).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Tech Supplies Co.',
        email: 'contact@techsupplies.com',
        phone: '(11) 1234-5678',
        city: 'São Paulo',
        state: 'SP',
        isActive: true,
      }),
    );
  });

  it('should create a supplier without optional fields', async () => {
    const result = await sut.execute({
      name: 'Simple Supplier',
    });

    expect(result.supplier.name).toBe('Simple Supplier');
    expect(result.supplier.cnpj).toBeUndefined();
    expect(result.supplier.email).toBeUndefined();
  });

  it('should not create a supplier with empty name', async () => {
    await expect(
      sut.execute({
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a supplier with name longer than 200 characters', async () => {
    await expect(
      sut.execute({
        name: 'a'.repeat(201),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a supplier with invalid CNPJ', async () => {
    await expect(
      sut.execute({
        name: 'Tech Supplies Co.',
        cnpj: '12.345.678/0001-00', // Invalid CNPJ
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a supplier with duplicate CNPJ', async () => {
    await sut.execute({
      name: 'Tech Supplies Co.',
      cnpj: '11.222.333/0001-81',
    });

    await expect(
      sut.execute({
        name: 'Another Supplier',
        cnpj: '11.222.333/0001-81',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a supplier with invalid email', async () => {
    await expect(
      sut.execute({
        name: 'Tech Supplies Co.',
        email: 'invalid-email',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a supplier with invalid rating', async () => {
    await expect(
      sut.execute({
        name: 'Tech Supplies Co.',
        rating: 6,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create an inactive supplier', async () => {
    const result = await sut.execute({
      name: 'Inactive Supplier',
      isActive: false,
    });

    expect(result.supplier.isActive).toBe(false);
  });
});
