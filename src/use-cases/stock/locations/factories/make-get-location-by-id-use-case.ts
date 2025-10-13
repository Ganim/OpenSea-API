import { PrismaLocationsRepository } from '@/repositories/stock/prisma/prisma-locations-repository';
import { GetLocationByIdUseCase } from '@/use-cases/stock/locations/get-location-by-id';

export function makeGetLocationByIdUseCase() {
  const locationsRepository = new PrismaLocationsRepository();
  return new GetLocationByIdUseCase(locationsRepository);
}
