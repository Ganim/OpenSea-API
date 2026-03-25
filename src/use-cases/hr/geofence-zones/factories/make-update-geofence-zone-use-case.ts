import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { UpdateGeofenceZoneUseCase } from '../update-geofence-zone';

export function makeUpdateGeofenceZoneUseCase(): UpdateGeofenceZoneUseCase {
  const geofenceZonesRepository = new PrismaGeofenceZonesRepository();
  return new UpdateGeofenceZoneUseCase(geofenceZonesRepository);
}
