import { PrismaLocationsRepository } from '@/repositories/stock/prisma/prisma-locations-repository';
import { ListLocationsUseCase } from '@/use-cases/stock/locations/list-locations';

export function makeListLocationsUseCase() {
  const locationsRepository = new PrismaLocationsRepository();
  return new ListLocationsUseCase(locationsRepository);
}
