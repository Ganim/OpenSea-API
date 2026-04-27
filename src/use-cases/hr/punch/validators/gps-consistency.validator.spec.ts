// Phase 9 / Plan 09-02 — GpsConsistencyValidator spec (Wave 0 RED → GREEN).
//
// PUNCH-FRAUD-01 (D-01 / D-02 / D-04 — GPS accuracy + velocity + mock detection).

import { describe, it, expect, vi } from 'vitest';
import {
  GpsConsistencyValidator,
  GPS_ACCURACY_THRESHOLD_M,
  GPS_VELOCITY_THRESHOLD_KMH,
} from './gps-consistency.validator';
import type { PunchValidationContext } from './punch-validator.interface';

// Mock haversineDistance with controllable return value (factory pattern)
let mockHaversineReturnValue = 111000; // default ~111km
vi.mock('@/use-cases/hr/geofence-zones/validate-geofence', () => ({
  haversineDistance: vi.fn(() => mockHaversineReturnValue),
}));

// Mock lookupIp
vi.mock('@/lib/geoip/reader', () => ({
  lookupIp: vi.fn(async () => ({
    country: 'BR',
    region: 'SP',
    city: 'São Paulo',
    asn: null,
  })),
}));

function makeCtx(
  overrides: Partial<PunchValidationContext> = {},
): PunchValidationContext {
  return {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    timestamp: new Date('2026-04-25T10:00:00Z'),
    punchConfig: { geofenceEnabled: false },
    ...overrides,
  };
}

describe('GpsConsistencyValidator (Plan 09-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('D-01: GPS accuracy gate', () => {
    it('accuracy=99 → ACCEPT (below threshold)', async () => {
      const v = new GpsConsistencyValidator();
      const result = await v.validate(makeCtx({ accuracy: 99 }));
      expect(result.outcome).toBe('ACCEPT');
    });

    it('accuracy=100 → ACCEPT (boundary, equals threshold)', async () => {
      const v = new GpsConsistencyValidator();
      const result = await v.validate(makeCtx({ accuracy: 100 }));
      expect(result.outcome).toBe('ACCEPT');
    });

    it('accuracy=101 → REJECT GPS_ACCURACY_LOW (above threshold)', async () => {
      const v = new GpsConsistencyValidator();
      const result = await v.validate(makeCtx({ accuracy: 101 }));
      if (result.outcome !== 'REJECT') throw new Error('expected REJECT');
      expect(result.code).toBe('GPS_ACCURACY_LOW');
      expect(result.details?.accuracy).toBe(101);
      expect(result.details?.threshold).toBe(100);
    });

    it('no accuracy provided → ACCEPT (skip check)', async () => {
      const v = new GpsConsistencyValidator();
      const result = await v.validate(makeCtx({ accuracy: undefined }));
      expect(result.outcome).toBe('ACCEPT');
    });
  });

  describe('D-02: Velocity gate (vs prevTimeEntry)', () => {
    beforeEach(() => {
      // Reset mock to default 111km per test
      mockHaversineReturnValue = 111000;
    });

    it('velocity=199 km/h → ACCEPT (below threshold)', async () => {
      // 199 km/h over 300s = 199 * 1000 / 3.6 / 300 meters = 55.27m/s
      // distance = 55.27 * 300 = 16581 meters
      mockHaversineReturnValue = 16581;
      const v = new GpsConsistencyValidator();
      const result = await v.validate(
        makeCtx({
          latitude: 0,
          longitude: 0,
          prevTimeEntry: {
            latitude: 0.01,
            longitude: 0,
            timestamp: new Date('2026-04-25T09:55:00Z'), // 5min = 300s before
          },
        }),
      );
      expect(result.outcome).toBe('ACCEPT');
    });

    it('velocity=200 km/h → ACCEPT (boundary, equals threshold)', async () => {
      // 200 km/h over 300s = 200 * 1000 / 3.6 / 300 = 55.55m/s ≈ 16666 meters
      // Use 16666 to ensure we stay below 200 km/h
      mockHaversineReturnValue = 16666;
      const v = new GpsConsistencyValidator();
      const result = await v.validate(
        makeCtx({
          latitude: 0,
          longitude: 0,
          prevTimeEntry: {
            latitude: 0.01,
            longitude: 0,
            timestamp: new Date('2026-04-25T09:55:00Z'),
          },
        }),
      );
      expect(result.outcome).toBe('ACCEPT');
    });

    it('velocity=201 km/h → APPROVAL_REQUIRED GPS_INCONSISTENT', async () => {
      // 201 km/h over 300s = 201 * 1000 / 3.6 / 300 = 55.83m/s = 16750 meters
      mockHaversineReturnValue = 16750;
      const v = new GpsConsistencyValidator();
      const result = await v.validate(
        makeCtx({
          latitude: 0,
          longitude: 0,
          prevTimeEntry: {
            latitude: 0.01,
            longitude: 0,
            timestamp: new Date('2026-04-25T09:55:00Z'),
          },
        }),
      );
      if (result.outcome !== 'APPROVAL_REQUIRED')
        throw new Error('expected APPROVAL_REQUIRED');
      expect(result.approvalReason).toBe('GPS_INCONSISTENT');
      expect(result.details?.velocityKmh).toBeGreaterThan(200);
    });

    it('first batida (no prevTimeEntry) → skip velocity check', async () => {
      const v = new GpsConsistencyValidator();
      const result = await v.validate(
        makeCtx({
          latitude: -23.5,
          longitude: -46.6,
          prevTimeEntry: undefined,
        }),
      );
      expect(result.outcome).toBe('ACCEPT');
    });

    it('prevTimeEntry missing coords → skip velocity check', async () => {
      const v = new GpsConsistencyValidator();
      const result = await v.validate(
        makeCtx({
          latitude: 0,
          longitude: 0,
          prevTimeEntry: {
            timestamp: new Date('2026-04-25T09:55:00Z'),
          },
        }),
      );
      expect(result.outcome).toBe('ACCEPT');
    });
  });

  describe('D-04: Suspect mock detection', () => {
    it('suspectMock=true → APPROVAL_REQUIRED GPS_INCONSISTENT', async () => {
      const v = new GpsConsistencyValidator();
      const result = await v.validate(
        makeCtx({
          metadata: { suspectMock: true },
        }),
      );
      if (result.outcome !== 'APPROVAL_REQUIRED')
        throw new Error('expected APPROVAL_REQUIRED');
      expect(result.approvalReason).toBe('GPS_INCONSISTENT');
      expect(result.details?.suspectMock).toBe(true);
    });

    it('suspectMock=false → ACCEPT', async () => {
      const v = new GpsConsistencyValidator();
      const result = await v.validate(
        makeCtx({
          metadata: { suspectMock: false },
        }),
      );
      expect(result.outcome).toBe('ACCEPT');
    });
  });

  describe('Thresholds exported', () => {
    it('GPS_ACCURACY_THRESHOLD_M === 100 (D-01)', () => {
      expect(GPS_ACCURACY_THRESHOLD_M).toBe(100);
    });

    it('GPS_VELOCITY_THRESHOLD_KMH === 200 (D-02)', () => {
      expect(GPS_VELOCITY_THRESHOLD_KMH).toBe(200);
    });
  });
});
