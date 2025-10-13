import { describe, it, expect, beforeEach } from 'vitest';
import { ListLocationsUseCase } from './list-locations';
import { CreateLocationUseCase } from './create-location';
import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';

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
      code: 'WH-001',
      locationType: 'WAREHOUSE',
    });

    await createLocation.execute({
      code: 'ZONE-A',
      locationType: 'ZONE',
    });

    const result = await sut.execute();

    expect(result.locations).toHaveLength(2);
    expect(result.locations[0].code).toBe('WH-001');
    expect(result.locations[1].code).toBe('ZONE-A');
  });

  it('should return empty array when no locations exist', async () => {
    const result = await sut.execute();

    expect(result.locations).toHaveLength(0);
  });
});
