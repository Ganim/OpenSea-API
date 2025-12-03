import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateManufacturerUseCase } from './create-manufacturer';
import { DeleteManufacturerUseCase } from './delete-manufacturer';
import { GetManufacturerByIdUseCase } from './get-manufacturer-by-id';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: DeleteManufacturerUseCase;
let createManufacturer: CreateManufacturerUseCase;
let getManufacturer: GetManufacturerByIdUseCase;

describe('DeleteManufacturerUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new DeleteManufacturerUseCase(manufacturersRepository);
    createManufacturer = new CreateManufacturerUseCase(manufacturersRepository);
    getManufacturer = new GetManufacturerByIdUseCase(manufacturersRepository);
  });

  it('should delete a manufacturer', async () => {
    const created = await createManufacturer.execute({
      name: 'TechCorp',
      country: 'United States',
    });

    await sut.execute({ id: created.manufacturer.manufacturerId.toString() });

    await expect(
      getManufacturer.execute({
        id: created.manufacturer.manufacturerId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error if manufacturer not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
