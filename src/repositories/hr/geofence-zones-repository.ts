import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeofenceZone } from '@/entities/hr/geofence-zone';

export interface CreateGeofenceZoneData {
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive?: boolean;
  address?: string | null;
}

export interface UpdateGeofenceZoneData {
  name?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  isActive?: boolean;
  address?: string | null;
}

export interface GeofenceZonesRepository {
  create(data: CreateGeofenceZoneData): Promise<GeofenceZone>;
  findById(id: UniqueEntityID, tenantId: string): Promise<GeofenceZone | null>;
  findManyByTenantId(tenantId: string): Promise<GeofenceZone[]>;
  findActiveByTenantId(tenantId: string): Promise<GeofenceZone[]>;
  update(
    id: UniqueEntityID,
    tenantId: string,
    data: UpdateGeofenceZoneData,
  ): Promise<GeofenceZone>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
