import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryManufacturersRepository } from '@/repositories/hr/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateManufacturerUseCase } from './create-manufacturer';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: CreateManufacturerUseCase;

describe('CreateManufacturerUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new CreateManufacturerUseCase(manufacturersRepository);
  });

  it('should create a manufacturer with CNPJ', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      legalName: 'Fabricante Nacional LTDA',
      cnpj: '12345678000100',
      tradeName: 'Fab Nacional',
      qualityRating: 4.5,
      defectRate: 2.3,
    });

    expect(result.manufacturer).toBeDefined();
    expect(result.manufacturer.legalName).toBe('Fabricante Nacional LTDA');
    expect(result.manufacturer.cnpj).toBe('12345678000100');
    expect(result.manufacturer.tradeName).toBe('Fab Nacional');
    expect(result.manufacturer.qualityRating).toBe(4.5);
    expect(result.manufacturer.defectRate).toBe(2.3);
  });

  it('should create a manufacturer with CPF', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      legalName: 'João da Silva',
      cpf: '12345678901',
    });

    expect(result.manufacturer).toBeDefined();
    expect(result.manufacturer.legalName).toBe('João da Silva');
    expect(result.manufacturer.cpf).toBe('12345678901');
  });

  it('should throw BadRequestError when legalName is missing', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: '',
        cnpj: '12345678000100',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when neither CNPJ nor CPF provided', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fabricante Sem Documento',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when qualityRating > 5', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fabricante Rating Alto',
        cnpj: '11111111000111',
        qualityRating: 6,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when qualityRating < 0', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fabricante Rating Negativo',
        cnpj: '22222222000122',
        qualityRating: -1,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when defectRate > 100', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fabricante Defeito Alto',
        cnpj: '33333333000133',
        defectRate: 101,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when defectRate < 0', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fabricante Defeito Negativo',
        cnpj: '44444444000144',
        defectRate: -1,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when CNPJ already exists', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      legalName: 'Fabricante Original',
      cnpj: '55555555000155',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Fabricante Duplicado',
        cnpj: '55555555000155',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when CPF already exists', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      legalName: 'Pessoa Física Original',
      cpf: '99988877766',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        legalName: 'Pessoa Física Duplicada',
        cpf: '99988877766',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
