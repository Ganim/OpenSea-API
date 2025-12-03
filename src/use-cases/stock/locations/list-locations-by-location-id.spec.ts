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
      titulo: 'Warehouse A',
      type: LocationType.create('WAREHOUSE'),
      code: 'WHA01',
    });

    const childLocation1 = Location.create({
      titulo: 'Warehouse A Section 1',
      type: LocationType.create('ZONE'),
      parentId: parentLocation.id,
      code: 'WHA11',
    });

    const childLocation2 = Location.create({
      titulo: 'Warehouse A Section 2',
      type: LocationType.create('ZONE'),
      parentId: parentLocation.id,
      code: 'WHA12',
    });

    // Create another location that is not a child
    const otherLocation = Location.create({
      titulo: 'Warehouse B',
      type: LocationType.create('WAREHOUSE'),
      code: 'WHB01',
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
          titulo: 'Warehouse A Section 1',
        }),
        expect.objectContaining({
          id: childLocation2.id.toString(),
          titulo: 'Warehouse A Section 2',
        }),
      ]),
    );
  });

  it('should return empty array when location has no children', async () => {
    const location = Location.create({
      titulo: 'Warehouse A',
      type: LocationType.create('WAREHOUSE'),
      code: 'WHA01',
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
