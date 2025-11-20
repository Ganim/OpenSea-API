import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLocationUseCase } from './create-location';
import { DeleteLocationUseCase } from './delete-location';
import { GetLocationByIdUseCase } from './get-location-by-id';

let locationsRepository: InMemoryLocationsRepository;
let sut: DeleteLocationUseCase;
let createLocation: CreateLocationUseCase;
let getLocation: GetLocationByIdUseCase;

describe('DeleteLocationUseCase', () => {
  beforeEach(() => {
    locationsRepository = new InMemoryLocationsRepository();
    sut = new DeleteLocationUseCase(locationsRepository);
    createLocation = new CreateLocationUseCase(locationsRepository);
    getLocation = new GetLocationByIdUseCase(locationsRepository);
  });

  it('should delete a location', async () => {
    const created = await createLocation.execute({
      code: 'WH-001',
    });

    await sut.execute({ id: created.location.id.toString() });

    await expect(
      getLocation.execute({ id: created.location.id.toString() }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error if location not found', async () => {
    await expect(sut.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });
});
