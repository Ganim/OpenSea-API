import type { GeofenceZone } from '@/entities/hr/geofence-zone';
import type { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';

export interface ValidateGeofenceRequest {
  tenantId: string;
  latitude: number;
  longitude: number;
}

export interface ValidateGeofenceResponse {
  isWithinZone: boolean;
  matchedZone: GeofenceZone | null;
  distanceMeters: number | null;
}

/**
 * Calculates the Haversine distance between two geographic coordinates.
 * Returns the distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class ValidateGeofenceUseCase {
  constructor(private geofenceZonesRepository: GeofenceZonesRepository) {}

  async execute(
    request: ValidateGeofenceRequest,
  ): Promise<ValidateGeofenceResponse> {
    const { tenantId, latitude, longitude } = request;

    const activeZones =
      await this.geofenceZonesRepository.findActiveByTenantId(tenantId);

    if (activeZones.length === 0) {
      return {
        isWithinZone: false,
        matchedZone: null,
        distanceMeters: null,
      };
    }

    let closestZone: GeofenceZone | null = null;
    let closestDistance = Infinity;

    for (const zone of activeZones) {
      const distance = haversineDistance(
        latitude,
        longitude,
        zone.latitude,
        zone.longitude,
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestZone = zone;
      }

      if (distance <= zone.radiusMeters) {
        return {
          isWithinZone: true,
          matchedZone: zone,
          distanceMeters: Math.round(distance),
        };
      }
    }

    return {
      isWithinZone: false,
      matchedZone: closestZone,
      distanceMeters: Math.round(closestDistance),
    };
  }
}
