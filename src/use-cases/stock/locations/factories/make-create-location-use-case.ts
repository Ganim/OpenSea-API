import { PrismaLocationsRepository } from '@/repositories/stock/prisma/prisma-locations-repository';
import { CreateLocationUseCase } from '@/use-cases/stock/locations/create-location';

export function makeCreateLocationUseCase() {
  const locationsRepository = new PrismaLocationsRepository();
  return new CreateLocationUseCase(locationsRepository);
}
