import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { CreateGeofenceZoneUseCase } from '../create-geofence-zone';

export function makeCreateGeofenceZoneUseCase(): CreateGeofenceZoneUseCase {
  const geofenceZonesRepository = new PrismaGeofenceZonesRepository();
  return new CreateGeofenceZoneUseCase(geofenceZonesRepository);
}
