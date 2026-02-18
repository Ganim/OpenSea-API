import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/hr/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetManufacturerByIdUseCase } from './get-manufacturer-by-id';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: GetManufacturerByIdUseCase;

describe('GetManufacturerByIdUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new GetManufacturerByIdUseCase(manufacturersRepository);
  });

  it('should get a manufacturer by id', async () => {
    const manufacturer = await manufacturersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fabricante Teste',
      cnpj: '12345678000100',
    });

    const result = await sut.execute({
      id: manufacturer.id.toString(),
    });

    expect(result.manufacturer).toBeDefined();
    expect(result.manufacturer.id.toString()).toBe(manufacturer.id.toString());
    expect(result.manufacturer.legalName).toBe('Fabricante Teste');
    expect(result.manufacturer.cnpj).toBe('12345678000100');
  });

  it('should throw ResourceNotFoundError when not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
