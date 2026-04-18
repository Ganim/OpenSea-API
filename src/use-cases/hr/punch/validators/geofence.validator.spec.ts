import { describe, expect, it, vi } from 'vitest';

import type { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';

import { createValidationContext } from '../__fixtures__/create-validation-context';
import { GeofenceValidator } from './geofence.validator';

function makeRepo(
  findById: GeofenceZonesRepository['findById'],
): GeofenceZonesRepository {
  return { findById } as unknown as GeofenceZonesRepository;
}

// A zone centered at the origin (0,0) with a 100m radius makes the test
// arithmetic trivial: tiny latitude deltas → tiny distance in meters.
function makeZone(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: { toString: () => 'zone-1' },
    latitude: 0,
    longitude: 0,
    radiusMeters: 100,
    isActive: true,
    ...overrides,
  };
}

describe('GeofenceValidator', () => {
  it('ACCEPTs when geofenceEnabled is false (tenant toggle off)', async () => {
    const repo = makeRepo(vi.fn());
    const validator = new GeofenceValidator(repo);

    const decision = await validator.validate(
      createValidationContext({
        punchConfig: { geofenceEnabled: false },
        punchDevice: { id: 'd1', geofenceZoneId: 'zone-1' },
        latitude: 10,
        longitude: 10,
      }),
    );

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('ACCEPTs when the device has no geofenceZoneId bound', async () => {
    const repo = makeRepo(vi.fn());
    const validator = new GeofenceValidator(repo);

    const decision = await validator.validate(
      createValidationContext({
        punchConfig: { geofenceEnabled: true },
        punchDevice: { id: 'd1', geofenceZoneId: null },
        latitude: 10,
        longitude: 10,
      }),
    );

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('ACCEPTs when the client did not provide lat/long', async () => {
    const repo = makeRepo(vi.fn());
    const validator = new GeofenceValidator(repo);

    const decision = await validator.validate(
      createValidationContext({
        punchConfig: { geofenceEnabled: true },
        punchDevice: { id: 'd1', geofenceZoneId: 'zone-1' },
        latitude: undefined,
        longitude: undefined,
      }),
    );

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('ACCEPTs when the zone is flagged inactive (config drift, do not fail hard)', async () => {
    const repo = makeRepo(
      vi.fn().mockResolvedValue(makeZone({ isActive: false })),
    );
    const validator = new GeofenceValidator(repo);

    const decision = await validator.validate(
      createValidationContext({
        punchConfig: { geofenceEnabled: true },
        punchDevice: { id: 'd1', geofenceZoneId: 'zone-1' },
        latitude: 10,
        longitude: 10,
      }),
    );

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('ACCEPTs when the coordinates are inside the radius', async () => {
    const repo = makeRepo(vi.fn().mockResolvedValue(makeZone()));
    const validator = new GeofenceValidator(repo);

    // 0.00001 degree ≈ 1.11m — comfortably inside 100m radius.
    const decision = await validator.validate(
      createValidationContext({
        punchConfig: { geofenceEnabled: true },
        punchDevice: { id: 'd1', geofenceZoneId: 'zone-1' },
        latitude: 0.00001,
        longitude: 0.00001,
      }),
    );

    expect(decision).toEqual({ outcome: 'ACCEPT' });
  });

  it('returns APPROVAL_REQUIRED with OUT_OF_GEOFENCE when outside the radius (never REJECT — Pitfall 6 / D-12)', async () => {
    const repo = makeRepo(vi.fn().mockResolvedValue(makeZone()));
    const validator = new GeofenceValidator(repo);

    // 1 degree of latitude ≈ 111km — clearly outside the 100m radius.
    const decision = await validator.validate(
      createValidationContext({
        punchConfig: { geofenceEnabled: true },
        punchDevice: { id: 'd1', geofenceZoneId: 'zone-1' },
        latitude: 1,
        longitude: 1,
      }),
    );

    expect(decision.outcome).toBe('APPROVAL_REQUIRED');
    if (decision.outcome === 'APPROVAL_REQUIRED') {
      expect(decision.approvalReason).toBe('OUT_OF_GEOFENCE');
      expect(decision.details).toMatchObject({
        zoneId: 'zone-1',
        maxRadiusMeters: 100,
      });
      expect(typeof decision.details.distance).toBe('number');
      expect(decision.details.distance as number).toBeGreaterThan(100);
    }
  });
});
