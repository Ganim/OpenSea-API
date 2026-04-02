import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { GeofenceZone } from '@/entities/hr/geofence-zone';
import type {
  CreateGeofenceZoneData,
  GeofenceZonesRepository,
  UpdateGeofenceZoneData,
} from '../geofence-zones-repository';

export class InMemoryGeofenceZonesRepository
  implements GeofenceZonesRepository
{
  private items: GeofenceZone[] = [];

  async create(data: CreateGeofenceZoneData): Promise<GeofenceZone> {
    const id = new UniqueEntityID();
    const geofenceZone = GeofenceZone.create(
      {
        tenantId: data.tenantId,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        isActive: data.isActive ?? true,
        address: data.address ?? null,
      },
      id,
    );

    this.items.push(geofenceZone);
    return geofenceZone;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<GeofenceZone | null> {
    const geofenceZone = this.items.find(
      (item) => item.id.equals(id) && item.tenantId === tenantId,
    );
    return geofenceZone || null;
  }

  async findManyByTenantId(tenantId: string): Promise<GeofenceZone[]> {
    return this.items.filter((item) => item.tenantId === tenantId);
  }

  async findActiveByTenantId(tenantId: string): Promise<GeofenceZone[]> {
    return this.items.filter(
      (item) => item.tenantId === tenantId && item.isActive,
    );
  }

  async update(
    id: UniqueEntityID,
    tenantId: string,
    data: UpdateGeofenceZoneData,
  ): Promise<GeofenceZone> {
    const index = this.items.findIndex(
      (item) => item.id.equals(id) && item.tenantId === tenantId,
    );

    if (index === -1) {
      throw new Error('Geofence zone not found');
    }

    const existing = this.items[index];

    const updatedZone = GeofenceZone.create(
      {
        tenantId: existing.tenantId,
        name: data.name ?? existing.name,
        latitude: data.latitude ?? existing.latitude,
        longitude: data.longitude ?? existing.longitude,
        radiusMeters: data.radiusMeters ?? existing.radiusMeters,
        isActive: data.isActive ?? existing.isActive,
        address: data.address !== undefined ? data.address : existing.address,
        createdAt: existing.createdAt,
      },
      existing.id,
    );

    this.items[index] = updatedZone;
    return updatedZone;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.equals(id) && item.tenantId === tenantId,
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  clear(): void {
    this.items = [];
  }
}
