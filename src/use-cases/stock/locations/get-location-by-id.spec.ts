import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLocationUseCase } from './create-location';
import { GetLocationByIdUseCase } from './get-location-by-id';

let locationsRepository: InMemoryLocationsRepository;
let sut: GetLocationByIdUseCase;
let createLocation: CreateLocationUseCase;

describe('GetLocationByIdUseCase', () => {
  beforeEach(() => {
    locationsRepository = new InMemoryLocationsRepository();
    sut = new GetLocationByIdUseCase(locationsRepository);
    createLocation = new CreateLocationUseCase(locationsRepository);
  });

  it('should get a location by id', async () => {
    const created = await createLocation.execute({
      code: 'WH-001',
      description: 'Main Warehouse',
      locationType: 'WAREHOUSE',
    });

    const result = await sut.execute({ id: created.location.id.toString() });

    expect(result.location).toEqual(
      expect.objectContaining({
        id: created.location.id.toString(),
        code: 'WH-001',
        description: 'Main Warehouse',
        locationType: 'WAREHOUSE',
      }),
    );
  });

  it('should throw error if location not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
