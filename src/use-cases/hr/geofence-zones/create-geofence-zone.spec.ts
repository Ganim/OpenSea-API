import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryGeofenceZonesRepository } from '@/repositories/hr/in-memory/in-memory-geofence-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateGeofenceZoneUseCase } from './create-geofence-zone';

let geofenceZonesRepository: InMemoryGeofenceZonesRepository;
let sut: CreateGeofenceZoneUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Create Geofence Zone Use Case', () => {
  beforeEach(() => {
    geofenceZonesRepository = new InMemoryGeofenceZonesRepository();
    sut = new CreateGeofenceZoneUseCase(geofenceZonesRepository);
  });

  it('should create a geofence zone successfully', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Sede Principal',
      latitude: -23.5505,
      longitude: -46.6333,
    });

    expect(result.geofenceZone).toBeDefined();
    expect(result.geofenceZone.name).toBe('Sede Principal');
    expect(result.geofenceZone.latitude).toBe(-23.5505);
    expect(result.geofenceZone.longitude).toBe(-46.6333);
    expect(result.geofenceZone.radiusMeters).toBe(200);
    expect(result.geofenceZone.isActive).toBe(true);
  });

  it('should create a geofence zone with custom radius', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Filial Norte',
      latitude: -3.119,
      longitude: -60.0217,
      radiusMeters: 500,
    });

    expect(result.geofenceZone.radiusMeters).toBe(500);
  });

  it('should create a geofence zone with address', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Escritório Centro',
      latitude: -22.9068,
      longitude: -43.1729,
      address: 'Av. Rio Branco, 1 - Centro, Rio de Janeiro - RJ',
    });

    expect(result.geofenceZone.address).toBe(
      'Av. Rio Branco, 1 - Centro, Rio de Janeiro - RJ',
    );
  });

  it('should create an inactive geofence zone', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Depósito Antigo',
      latitude: -23.5505,
      longitude: -46.6333,
      isActive: false,
    });

    expect(result.geofenceZone.isActive).toBe(false);
  });

  it('should throw error when name is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '',
        latitude: -23.5505,
        longitude: -46.6333,
      }),
    ).rejects.toThrow('Geofence zone name is required');
  });

  it('should throw error when name is only whitespace', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: '   ',
        latitude: -23.5505,
        longitude: -46.6333,
      }),
    ).rejects.toThrow('Geofence zone name is required');
  });

  it('should throw error when latitude is below -90', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Invalid Zone',
        latitude: -91,
        longitude: -46.6333,
      }),
    ).rejects.toThrow('Latitude must be between -90 and 90');
  });

  it('should throw error when latitude is above 90', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Invalid Zone',
        latitude: 91,
        longitude: -46.6333,
      }),
    ).rejects.toThrow('Latitude must be between -90 and 90');
  });

  it('should throw error when longitude is below -180', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Invalid Zone',
        latitude: -23.5505,
        longitude: -181,
      }),
    ).rejects.toThrow('Longitude must be between -180 and 180');
  });

  it('should throw error when longitude is above 180', async () => {
    await expect(
      sut.execute({
        tenantId,
        name: 'Invalid Zone',
        latitude: -23.5505,
        longitude: 181,
      }),
    ).rejects.toThrow('Longitude must be between -180 and 180');
  });

  it('should accept boundary latitude values', async () => {
    const resultSouth = await sut.execute({
      tenantId,
      name: 'South Pole Zone',
      latitude: -90,
      longitude: 0,
    });
    expect(resultSouth.geofenceZone.latitude).toBe(-90);

    const resultNorth = await sut.execute({
      tenantId,
      name: 'North Pole Zone',
      latitude: 90,
      longitude: 0,
    });
    expect(resultNorth.geofenceZone.latitude).toBe(90);
  });

  it('should accept boundary longitude values', async () => {
    const resultWest = await sut.execute({
      tenantId,
      name: 'Date Line West',
      latitude: 0,
      longitude: -180,
    });
    expect(resultWest.geofenceZone.longitude).toBe(-180);

    const resultEast = await sut.execute({
      tenantId,
      name: 'Date Line East',
      latitude: 0,
      longitude: 180,
    });
    expect(resultEast.geofenceZone.longitude).toBe(180);
  });

  it('should trim the name', async () => {
    const result = await sut.execute({
      tenantId,
      name: '  Sede Principal  ',
      latitude: -23.5505,
      longitude: -46.6333,
    });

    expect(result.geofenceZone.name).toBe('Sede Principal');
  });

  it('should set null address when not provided', async () => {
    const result = await sut.execute({
      tenantId,
      name: 'Zona Sem Endereço',
      latitude: -23.5505,
      longitude: -46.6333,
    });

    expect(result.geofenceZone.address).toBeNull();
  });
});
