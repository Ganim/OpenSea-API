import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { DeleteGeofenceZoneUseCase } from '../delete-geofence-zone';

export function makeDeleteGeofenceZoneUseCase(): DeleteGeofenceZoneUseCase {
  const geofenceZonesRepository = new PrismaGeofenceZonesRepository();
  return new DeleteGeofenceZoneUseCase(geofenceZonesRepository);
}
