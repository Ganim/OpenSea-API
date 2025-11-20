import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Location } from '@/entities/stock/location';
import { LocationType } from '@/entities/stock/value-objects/location-type';
import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListLocationsByLocationIdUseCase } from './list-locations-by-location-id';

let locationsRepository: InMemoryLocationsRepository;
let listLocationsByLocationId: ListLocationsByLocationIdUseCase;

describe('ListLocationsByLocationIdUseCase', () => {
  beforeEach(() => {
    locationsRepository = new InMemoryLocationsRepository();
    listLocationsByLocationId = new ListLocationsByLocationIdUseCase(
      locationsRepository,
    );
  });

  it('should be able to list locations by parent location id', async () => {
    const parentLocation = Location.create({
      code: 'WH-A',
      description: 'Warehouse A',
      locationType: LocationType.create('WAREHOUSE'),
    });

    const childLocation1 = Location.create({
      code: 'WH-A-01',
      description: 'Warehouse A Section 1',
      locationType: LocationType.create('ZONE'),
      parentId: parentLocation.id,
    });

    const childLocation2 = Location.create({
      code: 'WH-A-02',
      description: 'Warehouse A Section 2',
      locationType: LocationType.create('ZONE'),
      parentId: parentLocation.id,
    });

    // Create another location that is not a child
    const otherLocation = Location.create({
      code: 'WH-B',
      description: 'Warehouse B',
      locationType: LocationType.create('WAREHOUSE'),
    });

    await locationsRepository.save(parentLocation);
    await locationsRepository.save(childLocation1);
    await locationsRepository.save(childLocation2);
    await locationsRepository.save(otherLocation);

    const result = await listLocationsByLocationId.execute({
      locationId: parentLocation.id.toString(),
    });

    expect(result.locations).toHaveLength(2);
    expect(result.locations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: childLocation1.id.toString(),
          code: 'WH-A-01',
          description: 'Warehouse A Section 1',
        }),
        expect.objectContaining({
          id: childLocation2.id.toString(),
          code: 'WH-A-02',
          description: 'Warehouse A Section 2',
        }),
      ]),
    );
  });

  it('should return empty array when location has no children', async () => {
    const location = Location.create({
      code: 'WH-A',
      description: 'Warehouse A',
      locationType: LocationType.create('WAREHOUSE'),
    });

    await locationsRepository.save(location);

    const result = await listLocationsByLocationId.execute({
      locationId: location.id.toString(),
    });

    expect(result.locations).toHaveLength(0);
  });

  it('should return empty array when location does not exist', async () => {
    const result = await listLocationsByLocationId.execute({
      locationId: new UniqueEntityID().toString(),
    });

    expect(result.locations).toHaveLength(0);
  });
});
