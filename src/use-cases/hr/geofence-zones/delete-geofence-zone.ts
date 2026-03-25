import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeofenceZonesRepository } from '@/repositories/hr/geofence-zones-repository';

export interface DeleteGeofenceZoneRequest {
  id: string;
  tenantId: string;
}

export class DeleteGeofenceZoneUseCase {
  constructor(private geofenceZonesRepository: GeofenceZonesRepository) {}

  async execute(request: DeleteGeofenceZoneRequest): Promise<void> {
    const { id, tenantId } = request;

    const existing = await this.geofenceZonesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Geofence zone not found');
    }

    await this.geofenceZonesRepository.delete(
      new UniqueEntityID(id),
      tenantId,
    );
  }
}
