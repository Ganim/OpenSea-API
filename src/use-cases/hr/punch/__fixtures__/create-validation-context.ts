import type { PunchValidationContext } from '../validators/punch-validator.interface';

/**
 * Test fixture helper — builds a baseline `PunchValidationContext` that
 * every validator spec can mutate per test case.
 *
 * Defaults intentionally opt-OUT of geofence enforcement so specs that do
 * not care about geofence don't need to stub zones/coordinates. Specs
 * covering `GeofenceValidator` flip `punchConfig.geofenceEnabled` to
 * `true` and provide latitude/longitude/device explicitly.
 */
export function createValidationContext(
  overrides: Partial<PunchValidationContext> = {},
): PunchValidationContext {
  return {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    timestamp: new Date('2026-04-18T12:00:00Z'),
    latitude: undefined,
    longitude: undefined,
    punchDevice: undefined,
    punchConfig: { geofenceEnabled: false },
    ...overrides,
  };
}
