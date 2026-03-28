import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryGeofenceZonesRepository } from '@/repositories/hr/in-memory/in-memory-geofence-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  haversineDistance,
  ValidateGeofenceUseCase,
} from './validate-geofence';

let geofenceZonesRepository: InMemoryGeofenceZonesRepository;
let sut: ValidateGeofenceUseCase;
const tenantId = new UniqueEntityID().toString();

// Coordinates for testing: Av. Paulista, São Paulo
const SEDE_LAT = -23.5614;
const SEDE_LON = -46.6558;

describe('Validate Geofence Use Case', () => {
  beforeEach(async () => {
    geofenceZonesRepository = new InMemoryGeofenceZonesRepository();
    sut = new ValidateGeofenceUseCase(geofenceZonesRepository);

    // Create an active zone at Av. Paulista with 200m radius
    await geofenceZonesRepository.create({
      tenantId,
      name: 'Sede Paulista',
      latitude: SEDE_LAT,
      longitude: SEDE_LON,
      radiusMeters: 200,
      isActive: true,
    });
  });

  it('should validate location within zone radius', async () => {
    // Point very close to the center (within 200m)
    const result = await sut.execute({
      tenantId,
      latitude: SEDE_LAT + 0.0001,
      longitude: SEDE_LON + 0.0001,
    });

    expect(result.isWithinZone).toBe(true);
    expect(result.matchedZone).not.toBeNull();
    expect(result.matchedZone!.name).toBe('Sede Paulista');
    expect(result.distanceMeters).toBeDefined();
    expect(result.distanceMeters!).toBeLessThan(200);
  });

  it('should reject location outside zone radius', async () => {
    // Point far away (roughly 5km south)
    const result = await sut.execute({
      tenantId,
      latitude: SEDE_LAT - 0.05,
      longitude: SEDE_LON,
    });

    expect(result.isWithinZone).toBe(false);
    expect(result.matchedZone).not.toBeNull();
    expect(result.distanceMeters).not.toBeNull();
    expect(result.distanceMeters!).toBeGreaterThan(200);
  });

  it('should return the exact center point as within zone', async () => {
    const result = await sut.execute({
      tenantId,
      latitude: SEDE_LAT,
      longitude: SEDE_LON,
    });

    expect(result.isWithinZone).toBe(true);
    expect(result.distanceMeters).toBe(0);
  });

  it('should return false when no active zones exist', async () => {
    const emptyTenantId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId: emptyTenantId,
      latitude: SEDE_LAT,
      longitude: SEDE_LON,
    });

    expect(result.isWithinZone).toBe(false);
    expect(result.matchedZone).toBeNull();
    expect(result.distanceMeters).toBeNull();
  });

  it('should ignore inactive zones', async () => {
    // Create an inactive zone with a very large radius that would otherwise match
    await geofenceZonesRepository.create({
      tenantId,
      name: 'Zona Inativa Grande',
      latitude: -22.0,
      longitude: -43.0,
      radiusMeters: 500000, // 500km
      isActive: false,
    });

    // Point close to the inactive zone but far from active zone
    const result = await sut.execute({
      tenantId,
      latitude: -22.0,
      longitude: -43.0,
    });

    // Should not match the inactive zone, should be outside the active zone
    expect(result.isWithinZone).toBe(false);
    expect(result.matchedZone!.name).toBe('Sede Paulista');
  });

  it('should match the first zone within radius when multiple zones exist', async () => {
    // Create a second active zone at a different location
    await geofenceZonesRepository.create({
      tenantId,
      name: 'Filial Pinheiros',
      latitude: -23.5677,
      longitude: -46.6919,
      radiusMeters: 300,
      isActive: true,
    });

    // Point within the second zone
    const result = await sut.execute({
      tenantId,
      latitude: -23.5677,
      longitude: -46.6919,
    });

    expect(result.isWithinZone).toBe(true);
    expect(result.matchedZone).not.toBeNull();
  });

  it('should return closest zone when outside all zones', async () => {
    // Create a second active zone
    await geofenceZonesRepository.create({
      tenantId,
      name: 'Filial Curitiba',
      latitude: -25.4284,
      longitude: -49.2733,
      radiusMeters: 200,
      isActive: true,
    });

    // Point roughly equidistant but closer to Curitiba
    const result = await sut.execute({
      tenantId,
      latitude: -25.0,
      longitude: -49.0,
    });

    expect(result.isWithinZone).toBe(false);
    expect(result.matchedZone).not.toBeNull();
    expect(result.matchedZone!.name).toBe('Filial Curitiba');
  });

  it('should round distance to nearest integer', async () => {
    const result = await sut.execute({
      tenantId,
      latitude: SEDE_LAT + 0.001,
      longitude: SEDE_LON + 0.001,
    });

    expect(Number.isInteger(result.distanceMeters)).toBe(true);
  });
});

describe('haversineDistance function', () => {
  it('should return 0 for the same point', () => {
    const distance = haversineDistance(-23.5505, -46.6333, -23.5505, -46.6333);
    expect(distance).toBe(0);
  });

  it('should calculate a known distance correctly', () => {
    // São Paulo to Rio de Janeiro (approximately 360km)
    const distance = haversineDistance(-23.5505, -46.6333, -22.9068, -43.1729);
    const distanceKm = distance / 1000;

    expect(distanceKm).toBeGreaterThan(350);
    expect(distanceKm).toBeLessThan(370);
  });

  it('should calculate short distances accurately', () => {
    // Two points approximately 111m apart (0.001 degree latitude)
    const distance = haversineDistance(0, 0, 0.001, 0);
    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(120);
  });

  it('should be symmetric', () => {
    const distanceAB = haversineDistance(
      -23.5505,
      -46.6333,
      -22.9068,
      -43.1729,
    );
    const distanceBA = haversineDistance(
      -22.9068,
      -43.1729,
      -23.5505,
      -46.6333,
    );

    expect(distanceAB).toBeCloseTo(distanceBA, 6);
  });

  it('should handle antipodal points', () => {
    // Two points on opposite sides of the Earth
    const distance = haversineDistance(0, 0, 0, 180);
    const halfEarthCircumference = Math.PI * 6371000;

    expect(distance).toBeCloseTo(halfEarthCircumference, -3);
  });
});
