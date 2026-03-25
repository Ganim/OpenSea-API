import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { GeofenceZone } from '@/entities/hr/geofence-zone';
import type { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';

export interface CreateGeofenceZoneRequest {
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  isActive?: boolean;
  address?: string | null;
}

export interface CreateGeofenceZoneResponse {
  geofenceZone: GeofenceZone;
}

export class CreateGeofenceZoneUseCase {
  constructor(private geofenceZonesRepository: GeofenceZonesRepository) {}

  async execute(
    request: CreateGeofenceZoneRequest,
  ): Promise<CreateGeofenceZoneResponse> {
    const { tenantId, name, latitude, longitude, radiusMeters, isActive, address } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Geofence zone name is required');
    }

    if (latitude < -90 || latitude > 90) {
      throw new BadRequestError('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new BadRequestError('Longitude must be between -180 and 180');
    }

    const geofenceZone = await this.geofenceZonesRepository.create({
      tenantId,
      name: name.trim(),
      latitude,
      longitude,
      radiusMeters: radiusMeters ?? 200,
      isActive: isActive ?? true,
      address: address ?? null,
    });

    return { geofenceZone };
  }
}
