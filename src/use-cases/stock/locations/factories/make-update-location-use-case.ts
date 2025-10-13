import { PrismaLocationsRepository } from '@/repositories/stock/prisma/prisma-locations-repository';
import { UpdateLocationUseCase } from '@/use-cases/stock/locations/update-location';

export function makeUpdateLocationUseCase() {
  const locationsRepository = new PrismaLocationsRepository();
  return new UpdateLocationUseCase(locationsRepository);
}
