import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateManufacturerUseCase } from './create-manufacturer';
import { UpdateManufacturerUseCase } from './update-manufacturer';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: UpdateManufacturerUseCase;
let createManufacturer: CreateManufacturerUseCase;

describe('UpdateManufacturerUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new UpdateManufacturerUseCase(manufacturersRepository);
    createManufacturer = new CreateManufacturerUseCase(manufacturersRepository);
  });

  it('should update a manufacturer', async () => {
    const created = await createManufacturer.execute({
      name: 'TechCorp',
      country: 'United States',
    });

    const result = await sut.execute({
      id: created.manufacturer.manufacturerId.toString(),
      name: 'TechCorp Industries',
      country: 'Canada',
      rating: 4.8,
    });

    expect(result.manufacturer).toEqual(
      expect.objectContaining({
        manufacturerId: created.manufacturer.manufacturerId,
        name: 'TechCorp Industries',
        country: 'Canada',
        rating: 4.8,
      }),
    );
  });

  it('should update only provided fields', async () => {
    const created = await createManufacturer.execute({
      name: 'TechCorp',
      country: 'United States',
      email: 'contact@techcorp.com',
    });

    const result = await sut.execute({
      id: created.manufacturer.manufacturerId.toString(),
      rating: 4.5,
    });

    expect(result.manufacturer.name).toBe('TechCorp');
    expect(result.manufacturer.country).toBe('United States');
    expect(result.manufacturer.email).toBe('contact@techcorp.com');
    expect(result.manufacturer.rating).toBe(4.5);
  });

  it('should throw error if manufacturer not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        name: 'Updated Name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with empty name', async () => {
    const created = await createManufacturer.execute({
      name: 'TechCorp',
      country: 'United States',
    });

    await expect(
      sut.execute({
        id: created.manufacturer.manufacturerId.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with duplicate name', async () => {
    await createManufacturer.execute({
      name: 'TechCorp',
      country: 'United States',
    });

    const second = await createManufacturer.execute({
      name: 'Manufacturing Ltd',
      country: 'Brazil',
    });

    await expect(
      sut.execute({
        id: second.manufacturer.manufacturerId.toString(),
        name: 'TechCorp',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with invalid rating', async () => {
    const created = await createManufacturer.execute({
      name: 'TechCorp',
      country: 'United States',
    });

    await expect(
      sut.execute({
        id: created.manufacturer.manufacturerId.toString(),
        rating: 6,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
