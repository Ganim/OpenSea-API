import { PrismaLocationsRepository } from '@/repositories/stock/prisma/prisma-locations-repository';
import { ListLocationsByLocationIdUseCase } from '@/use-cases/stock/locations/list-locations-by-location-id';

export function makeListLocationsByLocationIdUseCase() {
  const locationsRepository = new PrismaLocationsRepository();
  return new ListLocationsByLocationIdUseCase(locationsRepository);
}