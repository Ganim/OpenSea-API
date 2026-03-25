import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { ListGeofenceZonesUseCase } from '../list-geofence-zones';

export function makeListGeofenceZonesUseCase(): ListGeofenceZonesUseCase {
  const geofenceZonesRepository = new PrismaGeofenceZonesRepository();
  return new ListGeofenceZonesUseCase(geofenceZonesRepository);
}
