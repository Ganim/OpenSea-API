import { PrismaLocationsRepository } from '@/repositories/stock/prisma/prisma-locations-repository';
import { DeleteLocationUseCase } from '@/use-cases/stock/locations/delete-location';

export function makeDeleteLocationUseCase() {
  const locationsRepository = new PrismaLocationsRepository();
  return new DeleteLocationUseCase(locationsRepository);
}
