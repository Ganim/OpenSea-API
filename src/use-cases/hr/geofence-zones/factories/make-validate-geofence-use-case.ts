import { PrismaGeofenceZonesRepository } from '@/repositories/hr/prisma/prisma-geofence-zones-repository';
import { ValidateGeofenceUseCase } from '../validate-geofence';

export function makeValidateGeofenceUseCase(): ValidateGeofenceUseCase {
  const geofenceZonesRepository = new PrismaGeofenceZonesRepository();
  return new ValidateGeofenceUseCase(geofenceZonesRepository);
}
