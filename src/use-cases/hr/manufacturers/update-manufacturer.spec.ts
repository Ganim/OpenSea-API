import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/hr/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateManufacturerUseCase } from './update-manufacturer';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: UpdateManufacturerUseCase;

describe('UpdateManufacturerUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new UpdateManufacturerUseCase(manufacturersRepository);
  });

  it('should update a manufacturer', async () => {
    const manufacturer = await manufacturersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fabricante Original',
      cnpj: '12345678000100',
    });

    const result = await sut.execute({
      id: manufacturer.id.toString(),
      legalName: 'Fabricante Atualizado',
      tradeName: 'Fab Atualizado',
      qualityRating: 4.2,
      defectRate: 1.5,
    });

    expect(result.manufacturer).toBeDefined();
    expect(result.manufacturer.legalName).toBe('Fabricante Atualizado');
    expect(result.manufacturer.tradeName).toBe('Fab Atualizado');
    expect(result.manufacturer.qualityRating).toBe(4.2);
    expect(result.manufacturer.defectRate).toBe(1.5);
  });

  it('should throw ResourceNotFoundError when not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        legalName: 'Nome Atualizado',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError when qualityRating > 5', async () => {
    const manufacturer = await manufacturersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fabricante Teste',
      cnpj: '11111111000111',
    });

    await expect(
      sut.execute({
        id: manufacturer.id.toString(),
        qualityRating: 6,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when defectRate > 100', async () => {
    const manufacturer = await manufacturersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fabricante Teste',
      cnpj: '22222222000122',
    });

    await expect(
      sut.execute({
        id: manufacturer.id.toString(),
        defectRate: 101,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
