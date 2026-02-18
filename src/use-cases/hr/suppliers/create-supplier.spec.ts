import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemorySuppliersRepository } from '@/repositories/hr/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSupplierUseCase } from './create-supplier';

let suppliersRepository: InMemorySuppliersRepository;
let sut: CreateSupplierUseCase;

describe('Create Supplier Use Case', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    sut = new CreateSupplierUseCase(suppliersRepository);
  });

  it('should create a supplier with CNPJ', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor ABC LTDA',
      cnpj: '12345678000100',
    });

    expect(result.supplier).toBeDefined();
    expect(result.supplier.legalName).toBe('Fornecedor ABC LTDA');
    expect(result.supplier.cnpj).toBe('12345678000100');
  });

  it('should create a supplier with CPF', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor Pessoa Fisica',
      cpf: '12345678901',
    });

    expect(result.supplier).toBeDefined();
    expect(result.supplier.legalName).toBe('Fornecedor Pessoa Fisica');
    expect(result.supplier.cpf).toBe('12345678901');
  });

  it('should throw BadRequestError when legalName is missing', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: '',
        cnpj: '12345678000100',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when neither CNPJ nor CPF provided', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fornecedor Sem Documento',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when rating is greater than 5', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fornecedor Rating Alto',
        cnpj: '12345678000100',
        rating: 6,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when rating is less than 0', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fornecedor Rating Negativo',
        cnpj: '12345678000100',
        rating: -1,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when CNPJ already exists', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor Original',
      cnpj: '12345678000100',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fornecedor Duplicado',
        cnpj: '12345678000100',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError when CPF already exists', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor PF Original',
      cpf: '12345678901',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fornecedor PF Duplicado',
        cpf: '12345678901',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
