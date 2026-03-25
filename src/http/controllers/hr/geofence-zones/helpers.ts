import type { GeofenceZone } from '@/entities/hr/geofence-zone';

export interface GeofenceZoneDTO {
  id: string;
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function geofenceZoneToDTO(zone: GeofenceZone): GeofenceZoneDTO {
  return {
    id: zone.id.toString(),
    tenantId: zone.tenantId,
    name: zone.name,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radiusMeters: zone.radiusMeters,
    isActive: zone.isActive,
    address: zone.address,
    createdAt: zone.createdAt,
    updatedAt: zone.updatedAt,
  };
}
