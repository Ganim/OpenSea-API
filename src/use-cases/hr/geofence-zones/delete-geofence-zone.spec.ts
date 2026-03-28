import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryGeofenceZonesRepository } from '@/repositories/hr/in-memory/in-memory-geofence-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteGeofenceZoneUseCase } from './delete-geofence-zone';

let geofenceZonesRepository: InMemoryGeofenceZonesRepository;
let sut: DeleteGeofenceZoneUseCase;
const tenantId = new UniqueEntityID().toString();
let existingZoneId: string;

describe('Delete Geofence Zone Use Case', () => {
  beforeEach(async () => {
    geofenceZonesRepository = new InMemoryGeofenceZonesRepository();
    sut = new DeleteGeofenceZoneUseCase(geofenceZonesRepository);

    const createdZone = await geofenceZonesRepository.create({
      tenantId,
      name: 'Sede Principal',
      latitude: -23.5505,
      longitude: -46.6333,
      radiusMeters: 200,
      isActive: true,
    });

    existingZoneId = createdZone.id.toString();
  });

  it('should delete a geofence zone successfully', async () => {
    await sut.execute({
      id: existingZoneId,
      tenantId,
    });

    // Verify it was actually deleted
    const findResult = await geofenceZonesRepository.findById(
      new UniqueEntityID(existingZoneId),
      tenantId,
    );
    expect(findResult).toBeNull();
  });

  it('should throw error when zone does not exist', async () => {
    const nonExistentZoneId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        id: nonExistentZoneId,
        tenantId,
      }),
    ).rejects.toThrow('Geofence zone not found');
  });

  it('should throw error when zone belongs to different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        id: existingZoneId,
        tenantId: differentTenantId,
      }),
    ).rejects.toThrow('Geofence zone not found');
  });

  it('should not find zone after deletion', async () => {
    await sut.execute({
      id: existingZoneId,
      tenantId,
    });

    await expect(
      sut.execute({
        id: existingZoneId,
        tenantId,
      }),
    ).rejects.toThrow('Geofence zone not found');
  });

  it('should only delete the specified zone', async () => {
    const secondZone = await geofenceZonesRepository.create({
      tenantId,
      name: 'Filial Sul',
      latitude: -25.4284,
      longitude: -49.2733,
      radiusMeters: 300,
    });

    await sut.execute({
      id: existingZoneId,
      tenantId,
    });

    // The other zone should still exist
    const remainingZone = await geofenceZonesRepository.findById(
      secondZone.id,
      tenantId,
    );
    expect(remainingZone).not.toBeNull();
    expect(remainingZone!.name).toBe('Filial Sul');
  });
});
