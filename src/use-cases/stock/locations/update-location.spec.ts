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
      titulo: 'Warehouse 001',
      type: 'WAREHOUSE',
      code: 'WH001',
    });

    const result = await sut.execute({
      id: created.location.id.toString(),
      code: 'WH002',
      titulo: 'Updated Warehouse',
      capacity: 500,
    });

    expect(result.location).toEqual(
      expect.objectContaining({
        id: created.location.id.toString(),
        code: 'WH002',
        titulo: 'Updated Warehouse',
        capacity: 500,
      }),
    );
  });

  it('should update location label', async () => {
    const created = await createLocation.execute({
      titulo: 'Warehouse 001',
      type: 'WAREHOUSE',
    });

    const result = await sut.execute({
      id: created.location.id.toString(),
      label: 'Primary storage facility',
    });

    expect(result.location.label).toBe('Primary storage facility');
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
      titulo: 'Test Location',
      type: 'WAREHOUSE',
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
      titulo: 'Warehouse 1',
      type: 'WAREHOUSE',
      code: 'WH001',
    });

    const second = await createLocation.execute({
      titulo: 'Warehouse 2',
      type: 'WAREHOUSE',
      code: 'WH002',
    });

    await expect(
      sut.execute({
        id: second.location.id.toString(),
        code: 'WH001',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with occupancy exceeding capacity', async () => {
    const created = await createLocation.execute({
      titulo: 'Test Location',
      type: 'WAREHOUSE',
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
