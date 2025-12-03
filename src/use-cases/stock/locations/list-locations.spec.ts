import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLocationUseCase } from './create-location';
import { ListLocationsUseCase } from './list-locations';

let locationsRepository: InMemoryLocationsRepository;
let sut: ListLocationsUseCase;
let createLocation: CreateLocationUseCase;

describe('ListLocationsUseCase', () => {
  beforeEach(() => {
    locationsRepository = new InMemoryLocationsRepository();
    sut = new ListLocationsUseCase(locationsRepository);
    createLocation = new CreateLocationUseCase(locationsRepository);
  });

  it('should list all active locations', async () => {
    await createLocation.execute({
      titulo: 'Warehouse 001',
      type: 'WAREHOUSE',
    });

    await createLocation.execute({
      titulo: 'Zone A',
      type: 'ZONE',
    });

    const result = await sut.execute();

    expect(result.locations).toHaveLength(2);
    expect(result.locations[0].titulo).toBe('Warehouse 001');
    expect(result.locations[1].titulo).toBe('Zone A');
  });

  it('should return empty array when no locations exist', async () => {
    const result = await sut.execute();

    expect(result.locations).toHaveLength(0);
  });
});
