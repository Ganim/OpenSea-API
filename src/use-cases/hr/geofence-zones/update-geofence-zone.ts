import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeofenceZone } from '@/entities/hr/geofence-zone';
import type {
  GeofenceZonesRepository,
  UpdateGeofenceZoneData,
} from '@/repositories/hr/geofence-zones-repository';

export interface UpdateGeofenceZoneRequest {
  id: string;
  tenantId: string;
  data: UpdateGeofenceZoneData;
}

export interface UpdateGeofenceZoneResponse {
  geofenceZone: GeofenceZone;
}

export class UpdateGeofenceZoneUseCase {
  constructor(private geofenceZonesRepository: GeofenceZonesRepository) {}

  async execute(
    request: UpdateGeofenceZoneRequest,
  ): Promise<UpdateGeofenceZoneResponse> {
    const { id, tenantId, data } = request;

    const existing = await this.geofenceZonesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Geofence zone not found');
    }

    const geofenceZone = await this.geofenceZonesRepository.update(
      new UniqueEntityID(id),
      tenantId,
      data,
    );

    return { geofenceZone };
  }
}
