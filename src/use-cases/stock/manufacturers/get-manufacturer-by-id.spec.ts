import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateManufacturerUseCase } from './create-manufacturer';
import { GetManufacturerByIdUseCase } from './get-manufacturer-by-id';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: GetManufacturerByIdUseCase;
let createManufacturer: CreateManufacturerUseCase;

describe('GetManufacturerByIdUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new GetManufacturerByIdUseCase(manufacturersRepository);
    createManufacturer = new CreateManufacturerUseCase(manufacturersRepository);
  });

  it('should get a manufacturer by id', async () => {
    const created = await createManufacturer.execute({
      name: 'TechCorp',
      country: 'United States',
    });

    const result = await sut.execute({ id: created.manufacturer.id });

    expect(result.manufacturer).toEqual(
      expect.objectContaining({
        id: created.manufacturer.id,
        name: 'TechCorp',
        country: 'United States',
      }),
    );
  });

  it('should throw error if manufacturer not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
