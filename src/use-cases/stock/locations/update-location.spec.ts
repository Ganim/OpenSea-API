import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLocationUseCase } from './create-location';
import { UpdateLocationUseCase } from './update-location';

let locationsRepository: InMemoryLocationsRepository;
let sut: UpdateLocationUseCase;
let createLocation: CreateLocationUseCase;

describe('UpdateLocationUseCase', () => {
  beforeEach(() => {
    locationsRepository = new InMemoryLocationsRepository();
    sut = new UpdateLocationUseCase(locationsRepository);
    createLocation = new CreateLocationUseCase(locationsRepository);
  });

  it('should update a location', async () => {
    const created = await createLocation.execute({
      code: 'WH-001',
      locationType: 'WAREHOUSE',
    });

    const result = await sut.execute({
      id: created.location.id.toString(),
      code: 'WH-002',
      description: 'Updated Warehouse',
      capacity: 500,
    });

    expect(result.location).toEqual(
      expect.objectContaining({
        id: created.location.id.toString(),
        code: 'WH-002',
        description: 'Updated Warehouse',
        capacity: 500,
      }),
    );
  });

  it('should update only provided fields', async () => {
    const created = await createLocation.execute({
      code: 'WH-001',
      description: 'Original',
      capacity: 1000,
    });

    const result = await sut.execute({
      id: created.location.id.toString(),
      description: 'Updated',
    });

    expect(result.location.code).toBe('WH-001');
    expect(result.location.description).toBe('Updated');
    expect(result.location.capacity).toBe(1000);
  });

  it('should throw error if location not found', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        code: 'WH-001',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update with empty code', async () => {
    const created = await createLocation.execute({
      code: 'WH-001',
    });

    await expect(
      sut.execute({
        id: created.location.id.toString(),
        code: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with duplicate code', async () => {
    await createLocation.execute({
      code: 'WH-001',
    });

    const second = await createLocation.execute({
      code: 'WH-002',
    });

    await expect(
      sut.execute({
        id: second.location.id.toString(),
        code: 'WH-001',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with occupancy exceeding capacity', async () => {
    const created = await createLocation.execute({
      code: 'WH-001',
      capacity: 100,
    });

    await expect(
      sut.execute({
        id: created.location.id.toString(),
        currentOccupancy: 150,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
