import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';
import { haversineDistance } from '@/use-cases/hr/geofence-zones/validate-geofence';
import { lookupIp } from '@/lib/geoip/reader';

/**
 * Phase 9 / Plan 09-02 / D-01 / D-02 / D-03 / D-04 — GPS consistency validator.
 *
 * Three independent checks:
 * 1. D-01: GPS accuracy gate — REJECT if accuracy > 100m (poor GPS signal)
 * 2. D-02: Velocity gate — APPROVAL_REQUIRED if velocity > 200 km/h vs prevTimeEntry
 *          (requires both prev and curr coords; skipped if no prevTimeEntry)
 * 3. D-04: Suspect mock detection — APPROVAL_REQUIRED if client-side heuristic fires
 *
 * D-03: IP geolocation lookup is NOT performed here — it's audit-only and handled
 * in ExecutePunchUseCase.writeAtomically (no rejection ever happens).
 */
export const GPS_ACCURACY_THRESHOLD_M = 100; // D-01
export const GPS_VELOCITY_THRESHOLD_KMH = 200; // D-02

export class GpsConsistencyValidator implements PunchValidator {
  readonly name = 'GpsConsistencyValidator';

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    // (1) D-01: accuracy gate — REJECT if > 100m
    if (ctx.accuracy != null && ctx.accuracy > GPS_ACCURACY_THRESHOLD_M) {
      return {
        outcome: 'REJECT',
        code: 'GPS_ACCURACY_LOW',
        reason: `GPS impreciso. Mova-se para área aberta e tente novamente`,
        details: {
          accuracy: ctx.accuracy,
          threshold: GPS_ACCURACY_THRESHOLD_M,
        },
      };
    }

    // (2) D-02: velocity gate — APPROVAL_REQUIRED if > 200 km/h vs prevTimeEntry
    let velocityKmh: number | null = null;
    if (
      ctx.prevTimeEntry?.latitude != null &&
      ctx.prevTimeEntry?.longitude != null &&
      ctx.latitude != null &&
      ctx.longitude != null
    ) {
      const distMeters = haversineDistance(
        ctx.prevTimeEntry.latitude,
        ctx.prevTimeEntry.longitude,
        ctx.latitude,
        ctx.longitude,
      );
      const elapsedSec = Math.max(
        1,
        (ctx.timestamp.getTime() - ctx.prevTimeEntry.timestamp.getTime()) /
          1000,
      );
      velocityKmh = (distMeters / elapsedSec) * 3.6;

      if (velocityKmh > GPS_VELOCITY_THRESHOLD_KMH) {
        return {
          outcome: 'APPROVAL_REQUIRED',
          approvalReason: 'GPS_INCONSISTENT',
          reason: `Velocity impossível detectada (${velocityKmh.toFixed(1)} km/h)`,
          details: {
            velocityKmh: Number(velocityKmh.toFixed(1)),
            elapsedSec,
            prevCoords: {
              lat: ctx.prevTimeEntry.latitude,
              lng: ctx.prevTimeEntry.longitude,
            },
            currCoords: { lat: ctx.latitude, lng: ctx.longitude },
          },
        };
      }
    }

    // (3) D-04: suspectMock client-side flag → APPROVAL_REQUIRED audit-only
    if (ctx.metadata?.suspectMock === true) {
      return {
        outcome: 'APPROVAL_REQUIRED',
        approvalReason: 'GPS_INCONSISTENT',
        reason: 'GPS possivelmente forjado (mock detection client-side)',
        details: {
          suspectMock: true,
          velocityKmh:
            velocityKmh != null ? Number(velocityKmh.toFixed(1)) : null,
        },
      };
    }

    // D-03 IP geo lookup is performed in ExecutePunchUseCase.writeAtomically (audit-only,
    // doesn't influence the decision). This validator does not block on IP geo.
    return { outcome: 'ACCEPT' };
  }
}
