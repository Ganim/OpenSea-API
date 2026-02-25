import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { CheckLocationConsistencyUseCase } from '../check-location-consistency';

export function makeCheckLocationConsistencyUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const binsRepository = new PrismaBinsRepository();

  return new CheckLocationConsistencyUseCase(itemsRepository, binsRepository);
}
