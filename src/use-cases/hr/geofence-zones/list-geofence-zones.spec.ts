import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryGeofenceZonesRepository } from '@/repositories/hr/in-memory/in-memory-geofence-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListGeofenceZonesUseCase } from './list-geofence-zones';

let geofenceZonesRepository: InMemoryGeofenceZonesRepository;
let sut: ListGeofenceZonesUseCase;
const tenantId = new UniqueEntityID().toString();

describe('List Geofence Zones Use Case', () => {
  beforeEach(async () => {
    geofenceZonesRepository = new InMemoryGeofenceZonesRepository();
    sut = new ListGeofenceZonesUseCase(geofenceZonesRepository);

    await geofenceZonesRepository.create({
      tenantId,
      name: 'Sede Principal',
      latitude: -23.5505,
      longitude: -46.6333,
      radiusMeters: 200,
      isActive: true,
    });

    await geofenceZonesRepository.create({
      tenantId,
      name: 'Filial Norte',
      latitude: -3.119,
      longitude: -60.0217,
      radiusMeters: 500,
      isActive: true,
    });

    await geofenceZonesRepository.create({
      tenantId,
      name: 'Depósito Desativado',
      latitude: -22.9068,
      longitude: -43.1729,
      radiusMeters: 100,
      isActive: false,
    });
  });

  it('should list all geofence zones for a tenant', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.geofenceZones).toHaveLength(3);
  });

  it('should include both active and inactive zones', async () => {
    const result = await sut.execute({ tenantId });

    const activeZones = result.geofenceZones.filter((zone) => zone.isActive);
    const inactiveZones = result.geofenceZones.filter((zone) => !zone.isActive);

    expect(activeZones).toHaveLength(2);
    expect(inactiveZones).toHaveLength(1);
  });

  it('should return empty list for tenant with no zones', async () => {
    const emptyTenantId = new UniqueEntityID().toString();

    const result = await sut.execute({ tenantId: emptyTenantId });

    expect(result.geofenceZones).toHaveLength(0);
  });

  it('should not return zones from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    await geofenceZonesRepository.create({
      tenantId: otherTenantId,
      name: 'Zona de Outro Tenant',
      latitude: -15.7801,
      longitude: -47.9292,
      radiusMeters: 300,
    });

    const result = await sut.execute({ tenantId });
    expect(result.geofenceZones).toHaveLength(3);

    const otherResult = await sut.execute({ tenantId: otherTenantId });
    expect(otherResult.geofenceZones).toHaveLength(1);
  });
});
