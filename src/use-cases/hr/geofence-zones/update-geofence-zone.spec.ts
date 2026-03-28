import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryGeofenceZonesRepository } from '@/repositories/hr/in-memory/in-memory-geofence-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateGeofenceZoneUseCase } from './update-geofence-zone';

let geofenceZonesRepository: InMemoryGeofenceZonesRepository;
let sut: UpdateGeofenceZoneUseCase;
const tenantId = new UniqueEntityID().toString();
let existingZoneId: string;

describe('Update Geofence Zone Use Case', () => {
  beforeEach(async () => {
    geofenceZonesRepository = new InMemoryGeofenceZonesRepository();
    sut = new UpdateGeofenceZoneUseCase(geofenceZonesRepository);

    const createdZone = await geofenceZonesRepository.create({
      tenantId,
      name: 'Sede Principal',
      latitude: -23.5505,
      longitude: -46.6333,
      radiusMeters: 200,
      isActive: true,
      address: 'Av. Paulista, 1000 - São Paulo',
    });

    existingZoneId = createdZone.id.toString();
  });

  it('should update a geofence zone name', async () => {
    const result = await sut.execute({
      id: existingZoneId,
      tenantId,
      data: { name: 'Sede Renovada' },
    });

    expect(result.geofenceZone).toBeDefined();
    expect(result.geofenceZone.name).toBe('Sede Renovada');
  });

  it('should update coordinates', async () => {
    const result = await sut.execute({
      id: existingZoneId,
      tenantId,
      data: {
        latitude: -22.9068,
        longitude: -43.1729,
      },
    });

    expect(result.geofenceZone.latitude).toBe(-22.9068);
    expect(result.geofenceZone.longitude).toBe(-43.1729);
  });

  it('should update radius', async () => {
    const result = await sut.execute({
      id: existingZoneId,
      tenantId,
      data: { radiusMeters: 500 },
    });

    expect(result.geofenceZone.radiusMeters).toBe(500);
  });

  it('should deactivate a zone', async () => {
    const result = await sut.execute({
      id: existingZoneId,
      tenantId,
      data: { isActive: false },
    });

    expect(result.geofenceZone.isActive).toBe(false);
  });

  it('should update address', async () => {
    const result = await sut.execute({
      id: existingZoneId,
      tenantId,
      data: { address: 'Rua Augusta, 500 - São Paulo' },
    });

    expect(result.geofenceZone.address).toBe('Rua Augusta, 500 - São Paulo');
  });

  it('should set address to null', async () => {
    const result = await sut.execute({
      id: existingZoneId,
      tenantId,
      data: { address: null },
    });

    expect(result.geofenceZone.address).toBeNull();
  });

  it('should throw error when zone does not exist', async () => {
    const nonExistentZoneId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        id: nonExistentZoneId,
        tenantId,
        data: { name: 'Updated' },
      }),
    ).rejects.toThrow('Geofence zone not found');
  });

  it('should throw error when zone belongs to different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        id: existingZoneId,
        tenantId: differentTenantId,
        data: { name: 'Updated' },
      }),
    ).rejects.toThrow('Geofence zone not found');
  });

  it('should preserve unchanged fields during partial update', async () => {
    const result = await sut.execute({
      id: existingZoneId,
      tenantId,
      data: { name: 'Nome Atualizado' },
    });

    expect(result.geofenceZone.latitude).toBe(-23.5505);
    expect(result.geofenceZone.longitude).toBe(-46.6333);
    expect(result.geofenceZone.radiusMeters).toBe(200);
    expect(result.geofenceZone.isActive).toBe(true);
    expect(result.geofenceZone.address).toBe('Av. Paulista, 1000 - São Paulo');
  });
});
