import type { GeofenceZone } from '@/entities/hr/geofence-zone';
import type { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';

export interface ListGeofenceZonesRequest {
  tenantId: string;
}

export interface ListGeofenceZonesResponse {
  geofenceZones: GeofenceZone[];
}

export class ListGeofenceZonesUseCase {
  constructor(private geofenceZonesRepository: GeofenceZonesRepository) {}

  async execute(
    request: ListGeofenceZonesRequest,
  ): Promise<ListGeofenceZonesResponse> {
    const { tenantId } = request;

    const geofenceZones =
      await this.geofenceZonesRepository.findManyByTenantId(tenantId);

    return { geofenceZones };
  }
}
