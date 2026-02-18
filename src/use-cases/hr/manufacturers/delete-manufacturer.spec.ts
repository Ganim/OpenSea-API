import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/hr/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteManufacturerUseCase } from './delete-manufacturer';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: DeleteManufacturerUseCase;

describe('DeleteManufacturerUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new DeleteManufacturerUseCase(manufacturersRepository);
  });

  it('should delete a manufacturer', async () => {
    const manufacturer = await manufacturersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fabricante Para Deletar',
      cnpj: '12345678000100',
    });

    const result = await sut.execute({
      id: manufacturer.id.toString(),
    });

    expect(result.success).toBe(true);

    // Verify manufacturer is no longer found (soft delete)
    const found = await manufacturersRepository.findById(manufacturer.id);
    expect(found).toBeNull();
  });

  it('should throw ResourceNotFoundError when manufacturer not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
