import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';
import { haversineDistance } from '@/use-cases/hr/geofence-zones/validate-geofence';

import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Geofence check — the ONLY validator whose "bad" outcome is
 * `APPROVAL_REQUIRED`, never `REJECT`.
 *
 * Rationale (D-12 / PUNCH-CORE-06 / Portaria 671):
 *   Every batida must be persisted with a unique sequential NSR, even if
 *   the employee punched from the wrong place. Rejecting out-of-geofence
 *   punches would (a) violate the "imediata e imutável" rule and (b)
 *   silently lose audit evidence. Instead we record the punch normally
 *   and raise a PunchApproval PENDING for the manager to triage.
 *
 * Short-circuit ACCEPTs (all legitimate reasons to skip enforcement):
 * - Tenant toggle `punchConfig.geofenceEnabled = false`
 * - The authenticating device has no zone bound (personal PWA punch)
 * - Client did not supply latitude/longitude (we trust the device's
 *   presence; kiosks routinely omit GPS, e.g. offline mode)
 * - Zone row missing or flagged inactive (config drift, don't fail hard)
 *
 * Outside the zone: return `APPROVAL_REQUIRED` with the concrete
 * distance/zone/radius so the manager has enough context to triage.
 */
export class GeofenceValidator implements PunchValidator {
  readonly name = 'GeofenceValidator';

  constructor(
    private readonly geofenceZonesRepository: GeofenceZonesRepository,
  ) {}

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    if (!ctx.punchConfig.geofenceEnabled) return { outcome: 'ACCEPT' };
    if (!ctx.punchDevice?.geofenceZoneId) return { outcome: 'ACCEPT' };
    if (ctx.latitude == null || ctx.longitude == null) {
      return { outcome: 'ACCEPT' };
    }

    const zone = await this.geofenceZonesRepository.findById(
      new UniqueEntityID(ctx.punchDevice.geofenceZoneId),
      ctx.tenantId,
    );
    if (!zone || !zone.isActive) return { outcome: 'ACCEPT' };

    const distance = haversineDistance(
      zone.latitude,
      zone.longitude,
      ctx.latitude,
      ctx.longitude,
    );
    const radius = zone.radiusMeters ?? 100;

    if (distance <= radius) return { outcome: 'ACCEPT' };

    return {
      outcome: 'APPROVAL_REQUIRED',
      approvalReason: 'OUT_OF_GEOFENCE',
      reason: `Batida a ${Math.round(distance)}m da área permitida (raio ${radius}m)`,
      details: {
        distance: Math.round(distance),
        zoneId: zone.id.toString(),
        maxRadiusMeters: radius,
      },
    };
  }
}
